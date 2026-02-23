
import { app, ipcMain, BrowserWindow } from 'electron';
import { OtzovikParser } from './parsers/otzovik';
import { initDB, saveReview, getStats, getAllReviews, saveChunk } from './db/json-db';
import { ProxyManager } from './proxy-manager';
import { cleanReview } from '../../src/rag/cleaner';
import { chunkReview } from '../../src/rag/chunker';

let scraperInstance: OtzovikParser | null = null;
let isScraping = false;
let currentWindow: BrowserWindow | null = null;

// Helper to log to UI
const log = (msg: string) => {
    console.log(msg);
    if (currentWindow) currentWindow.webContents.send('scraper-log', msg);
};

export const setupScraperHandlers = (win: BrowserWindow) => {
    currentWindow = win;
    initDB(); // Ensure DB is ready

    ipcMain.handle('start-scrape', async (_, { url, maxPages, proxy, dbName }) => {
        if (isScraping) return { status: 'already_running' };

        // Initialize specific DB
        initDB(dbName || 'knowledge_base');

        isScraping = true;

        // Initialize Proxy Manager
        let proxyManager: ProxyManager | undefined;
        if (proxy) {
            // Check if it's a single object (old way) or string/array (new way)
            if (typeof proxy === 'string') {
                proxyManager = new ProxyManager(proxy);
                const count = proxy.split('\n').filter(p => p.trim()).length;
                log(`✅ Загружено ${count} прокси из списка.`);
            } else if (Array.isArray(proxy)) {
                proxyManager = new ProxyManager(proxy);
                log(`✅ Загружено ${proxy.length} прокси из массива.`);
            } else if (typeof proxy === 'object' && proxy.host) {
                proxyManager = new ProxyManager([proxy]); // Single proxy as list
                log(`✅ Загружен 1 прокси (Объект).`);
            }
        }

        scraperInstance = new OtzovikParser();

        try {
            // Pass the MANAGER, not just one proxy. The init method now handles getting the first one.
            await scraperInstance.init(true, proxyManager);
            log('🚀 Скрейпер запущен. Начинаю работу...');

            // 1. Get Reviews List
            let currentPage = 1;
            const limitPages = maxPages || 5;

            log(`Цель: ${url}`);
            log(`Макс. Страниц: ${limitPages}`);

            while (currentPage <= limitPages && isScraping) {
                const pageUrl = currentPage === 1 ? url : `${url}/${currentPage}/`;
                log(`\n📄 Обработка страницы ${currentPage}...`);

                // RETRY LOGIC FOR PAGE LOAD
                let reviews: any[] | null = null;
                let pageRetries = 0;
                const MAX_RETRIES = 3;

                while (pageRetries < MAX_RETRIES && isScraping) {
                    try {
                        reviews = await scraperInstance.parseReviewsList(pageUrl, 1);
                        break; // Success
                    } catch (e: any) {
                        pageRetries++;
                        log(`⚠️ Ошибка загрузки страницы (Попытка ${pageRetries}/${MAX_RETRIES}): ${e.message}`);

                        if (proxyManager) {
                            log(`🔄 Меняю прокси и пробую снова...`);
                            await scraperInstance.rotateIdentity();
                        }

                        // Wait a bit before retry
                        await new Promise(r => setTimeout(r, 2000));

                        if (pageRetries >= MAX_RETRIES) {
                            log(`❌ Не удалось загрузить страницу после ${MAX_RETRIES} попыток.`);
                            // Don't throw fatal, just try next page or break? 
                            // Usually if listing fails, next page might fail too, but let's break this page loop
                            break;
                        }
                    }
                }

                if (!reviews || reviews.length === 0) {
                    if (pageRetries >= MAX_RETRIES) {
                        log('🛑 Пропуск страницы из-за ошибок.');
                    } else {
                        log('Отзывы не найдены. Остановка.');
                    }
                    break;
                }

                log(`Найдено ${reviews.length} отзывов. Парсинг деталей...`);

                // Process 1 at a time (Sequential for Stealth)
                const BATCH_SIZE = 1;
                for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
                    if (!isScraping) break;

                    const batch = reviews.slice(i, i + BATCH_SIZE);
                    await Promise.all(batch.map(async (item) => {
                        try {
                            const exists = await import('./db/json-db').then(m => m.checkReviewExists(item.id));
                            if (exists) {
                                log(`[Пропуск] Отзыв ${item.id} уже существует.`);
                                return;
                            }

                            log(`[Парсинг] ${item.title.slice(0, 30)}...`);

                            // Retry Logic for Individual Review
                            let reviewRetries = 0;
                            let details: any = null;

                            while (reviewRetries < MAX_RETRIES && isScraping) {
                                try {
                                    // Rotate Proxy per Review!
                                    await scraperInstance!.rotateIdentity();
                                    details = await scraperInstance!.parseReview(item.url);
                                    break;
                                } catch (e: any) {
                                    reviewRetries++;
                                    log(`⚠️ Ошибка парсинга отзыва (Попытка ${reviewRetries}/${MAX_RETRIES}): ${e.message}`);
                                    if (proxyManager) await scraperInstance!.rotateIdentity();
                                    await new Promise(r => setTimeout(r, 1000));
                                }
                            }

                            if (details) {
                                saveReview(details);
                                sendStats();
                            } else {
                                log(`❌ Не удалось собрать отзыв ${item.id}`);
                            }
                        } catch (e: any) {
                            log(`❌ Ошибка: ${e.message}`);
                        }
                    }));
                }

                currentPage++;
                if (currentPage <= limitPages) {
                    log('Остываем (3 сек)...');
                    await new Promise(r => setTimeout(r, 3000));
                }
            }

            log('✅ Сбор завершен!');

        } catch (error: any) {
            log(`🔥 Критическая ошибка: ${error.message}`);
        } finally {
            if (scraperInstance) await scraperInstance.close();
            isScraping = false;
            scraperInstance = null;
        }
    });

    ipcMain.handle('stop-scrape', async () => {
        isScraping = false;
        log('🛑 Запрос остановки. Завершаю текущие операции...');
    });

    ipcMain.handle('build-knowledge-base', async (_, { dbName }) => {
        try {
            log(`🔨 Сборка Базы Знаний для ${dbName}...`);
            initDB(dbName); // Ensure we are on the right DB

            const reviews = await getAllReviews();
            log(`📚 Найдено ${reviews.length} отзывов для обработки.`);

            let count = 0;
            for (const row of reviews) {
                const reviewData: any = {
                    id: row.id,
                    productId: row.productId,
                    url: row.url,
                    datePublished: row.date_published,
                    author: { name: row.author },
                    rating: { value: row.rating },
                    content: {
                        title: row.title,
                        text: row.full_text,
                        pros: row.pros,
                        cons: row.cons,
                        summary: row.summary
                    },
                    metrics: {
                        likes: row.likes,
                        recommended: !!row.recommended
                    },
                    product: { url: row.productId, name: 'Unknown', category: 'Unknown', averageRating: 0, totalReviews: 0 }
                };

                const cleaned = cleanReview(reviewData);
                const chunks = chunkReview(cleaned);

                for (const chunk of chunks) {
                    saveChunk({
                        id: chunk.id,
                        review_id: cleaned.id,
                        content: chunk.content,
                        type: chunk.type
                    });
                }
                count++;
                if (count % 10 === 0) log(`✨ Обработано ${count}/${reviews.length} отзывов...`);
            }

            log(`✅ База Знаний собрана! Обработано ${count} отзывов.`);
            return { status: 'success', count };
        } catch (error: any) {
            log(`❌ Ошибка сборки KB: ${error.message}`);
            return { status: 'error', error: error.message };
        }
    });

    ipcMain.handle('get-reviews', async (_, { dbName }) => {
        try {
            initDB(dbName);
            const reviews = await getAllReviews();
            return { status: 'success', reviews };
        } catch (error: any) {
            return { status: 'error', error: error.message };
        }
    });

    ipcMain.handle('get-databases', async () => {
        try {
            const fs = require('fs');
            const path = require('path');
            // Determine DB path based on environment similar to sqlite.ts
            const dbDir = app.isPackaged ? app.getPath('userData') : path.join(__dirname, '../../');

            if (!fs.existsSync(dbDir)) return { status: 'success', files: [] };

            const files = fs.readdirSync(dbDir).filter((f: string) => f.endsWith('.json'));
            return { status: 'success', files };
        } catch (error: any) {
            return { status: 'error', error: error.message };
        }
    });

    ipcMain.handle('export-database', async (_, { dbName }) => {
        const { dialog } = require('electron');
        const fs = require('fs');

        try {
            const { filePath } = await dialog.showSaveDialog({
                title: 'Export Database',
                defaultPath: `${dbName}_export`,
                filters: [
                    { name: 'JSON Data', extensions: ['json'] },
                    { name: 'Markdown Report', extensions: ['md'] }
                ]
            });

            if (!filePath) return { status: 'cancelled' };

            initDB(dbName); // Ensure context

            // If user selected .json and it is NOT the db file itself (which is rare to select as target),
            // we proceed to export logic. Note: The raw DB file IS valid JSON, so we could just copy it 
            // if we want "backup". But 'export-database' usually implies data export.
            // Let's keep logic simple: always write fresh JSON from getAllReviews to ensure clean format.
            {
                const reviews = await getAllReviews();
                let content = '';

                if (filePath.endsWith('.json')) {
                    content = JSON.stringify(reviews, null, 2);
                } else if (filePath.endsWith('.md')) {
                    content = `# Export: ${dbName}\n\n`;
                    reviews.forEach((r: any) => {
                        content += `## ${r.title}\n`;
                        content += `**Rating:** ${r.rating} | **Author:** ${r.author} | **Date:** ${r.date_published}\n\n`;
                        content += `### Review\n${r.full_text}\n\n`;
                        content += `---\n\n`;
                    });
                }

                if (content) fs.writeFileSync(filePath, content);
            }

            return { status: 'success', path: filePath };
        } catch (error: any) {
            log(`❌ Ошибка экспорта: ${error.message}`);
            return { status: 'error', error: error.message };
        }
    });
};



async function sendStats() {
    if (currentWindow) {
        try {
            const stats = await getStats();
            currentWindow.webContents.send('stats-update', stats);
        } catch (e) {
            console.error('Failed to get stats', e);
        }
    }
}
