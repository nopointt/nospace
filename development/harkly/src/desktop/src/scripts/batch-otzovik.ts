
import { OtzovikParser } from '../parsers/otzovik';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Batch Scraper for Otzovik
 * Iterates through pagination and parses detailed reviews.
 */

const MAX_PAGES = 5; // Default max pages to scrape (safety limit)
const CONCURRENT_TABS = 3; // Open tabs (keep 3 for speed)
const RATE_LIMIT_DELAY = 3000; // 3 seconds between reviews

interface ScrapeConfig {
    productUrl: string;
    maxPages?: number;
    outputDir?: string;
}

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBatchScrape(config: ScrapeConfig) {
    console.log(`🚀 Starting Batch Scrape for: ${config.productUrl}`);

    const parser = new OtzovikParser();
    await parser.init();

    const outputDir = config.outputDir || path.join(process.cwd(), 'data/raw');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
        let currentPage = 1;
        const maxPages = config.maxPages || MAX_PAGES;
        let hasNextPage = true;

        while (hasNextPage && currentPage <= maxPages) {
            const pageUrl = currentPage === 1
                ? config.productUrl
                : `${config.productUrl}/${currentPage}/`;

            console.log(`\n📄 Processing Page ${currentPage}/${maxPages}: ${pageUrl}`);

            // 1. Get list of reviews from catalog page
            try {
                // Pass 1 strict page to avoid internal parser pagination overlap
                const reviewsList = await parser.parseReviewsList(pageUrl, 1);
                console.log(`   Found ${reviewsList.length} reviews on page.`);

                if (reviewsList.length === 0) {
                    console.log('   No reviews found, stopping pagination.');
                    break;
                }

                // 2. Process each review
                for (let i = 0; i < reviewsList.length; i++) {
                    const item = reviewsList[i];
                    console.log(`   [${i + 1}/${reviewsList.length}] Parsing: ${item.title}`);

                    // Check if already exists
                    // We need a unique ID, let's try to extract from URL or use a hash
                    // item.url usually looks like: https://otzovik.com/review_12345.html
                    const reviewIdMatch = item.url.match(/review_(\d+)/);
                    const reviewId = reviewIdMatch ? reviewIdMatch[1] : `unknown_${Date.now()}_${i}`;
                    const filename = `review_${reviewId}.json`;
                    const filePath = path.join(outputDir, filename);

                    if (fs.existsSync(filePath)) {
                        console.log(`      ⚠️ Already exists, skipping: ${filename}`);
                        continue;
                    }

                    // Parse Details
                    try {
                        const fullReview = await parser.parseReview(item.url);

                        if (fullReview) {
                            fs.writeFileSync(filePath, JSON.stringify(fullReview, null, 2));
                            console.log(`      ✅ Saved to ${filename}`);
                        } else {
                            console.error(`      ❌ Failed to parse details for ${item.url}`);
                        }

                        // Rate limit
                        await sleep(RATE_LIMIT_DELAY);

                    } catch (err) {
                        console.error(`      ❌ Error parsing review ${item.url}:`, err);
                    }
                }

                // Check for next page (simple heuristic: if we got full list likely there is more, 
                // but real check would be looking for 'next' button. For now Otzovik usually has 20 items per page)
                if (reviewsList.length < 20) {
                    hasNextPage = false;
                }

            } catch (err) {
                console.error(`Error processing page ${currentPage}:`, err);
                break; // Stop on page error
            }

            currentPage++;
            await sleep(5000); // Delay between pages
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await parser.close();
        console.log('\n🏁 Batch Scrape Finished.');
    }
}

// CLI usage if run directly
import * as readline from 'readline';

if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length > 0) {
        // Argument mode
        const url = args[0];
        const pages = args[1] ? parseInt(args[1]) : MAX_PAGES;
        runBatchScrape({ productUrl: url, maxPages: pages });
    } else {
        // Interactive mode
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question('🔗 Enter Otzovik Catalog URL: ', (url) => {
            if (!url) {
                console.error('❌ URL is required!');
                rl.close();
                process.exit(1);
            }

            rl.question(`📄 Enter Max Pages (default ${MAX_PAGES}): `, (pagesInput) => {
                const pages = pagesInput ? parseInt(pagesInput) : MAX_PAGES;
                rl.close();
                runBatchScrape({ productUrl: url.trim(), maxPages: pages });
            });
        });
    }
}
