import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { ProxyManager } from '../proxy-manager';

puppeteer.use(StealthPlugin());

export class OtzovikParser {
    private browser: any;
    private proxyManager?: ProxyManager;
    private currentProxy?: any;
    private isHeadless: boolean = true;
    private userDataPath: string = ''; // Keep empty to use default/temp or set specific if needed

    async init(headless: boolean = true, proxyManager?: ProxyManager) {
        this.isHeadless = headless;
        this.proxyManager = proxyManager;

        // Pick initial proxy if manager provided
        if (this.proxyManager) {
            this.currentProxy = this.proxyManager.getNext();
        }

        await this.launchBrowser();
    }

    private async launchBrowser() {
        const args = [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--window-size=1280,800',
            this.isHeadless ? '' : '--start-maximized'
        ].filter(Boolean);

        if (this.currentProxy?.host && this.currentProxy?.port) {
            args.push(`--proxy-server=${this.currentProxy.host}:${this.currentProxy.port}`);
        }

        this.browser = await puppeteer.launch({
            headless: this.isHeadless ? "new" : false,
            defaultViewport: null,
            userDataDir: this.userDataPath || undefined,
            args: args,
            ignoreHTTPSErrors: true,
            protocolTimeout: 120000,
        } as any);

        console.log(`Browser launched. Proxy: ${this.currentProxy?.host || 'Direct'}`);
    }

    async rotateIdentity() {
        if (!this.proxyManager) return;

        console.log('♻️ Rotating Identity (Proxy & Browser)...');
        await this.close();

        // Get Next Proxy
        this.currentProxy = this.proxyManager.getNext();

        // Relaunch
        await this.launchBrowser();
    }

    async close() {
        if (this.browser) {
            try {
                await this.browser.close();
            } catch (e) {
                console.error('Error closing browser during rotation:', e);
            }
            this.browser = null;
        }
    }

    private async randomDelay(min: number = 2000, max: number = 5000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        await new Promise(r => setTimeout(r, delay));
    }

    // New: Mimic human behavior (mouse moves, smooth scroll)
    private async mimicHuman(page: any) {
        // 1. Mouse movements
        try {
            // Move to random center-ish position
            await page.mouse.move(
                Math.floor(Math.random() * 500) + 200,
                Math.floor(Math.random() * 500) + 200
            );
            // Move a bit more
            await page.mouse.move(
                Math.floor(Math.random() * 800) + 100,
                Math.floor(Math.random() * 600) + 100,
                { steps: 10 }
            );
        } catch (e) {
            // Ignore mouse errors
        }

        // 2. Smooth Scroll down
        try {
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    // Randomize scroll intent
                    const maxScroll = document.body.scrollHeight * 0.7;

                    const timer = setInterval(() => {
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= maxScroll || totalHeight > 2000) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 100 + Math.random() * 100); // Randomize interval
                });
            });
        } catch (e) {
            // Ignore scroll errors
        }
    }

    async getPage(url: string): Promise<any> {
        if (!this.browser) await this.launchBrowser();

        let page: any = null;

        try {
            page = await this.browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            if (this.currentProxy?.username) {
                await page.authenticate({ username: this.currentProxy.username, password: this.currentProxy.password });
            }

            console.log(`Navigating to: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Check for Captcha
            const content = await page.content();
            if (content.includes('С Вашего IP-адреса было много обращений') || content.includes('Attention')) {
                console.log('🚨 CAPTCHA Detected! Initiating silent rotation...');
                await page.close();
                // Don't close browser, just rotate identity which closes and reopens

                // Ensure we stay headless
                this.isHeadless = true;

                console.log('🔄 IP Flagged. Rotating Identity silently...');

                if (!this.proxyManager) {
                    console.error('❌ Fatal: CAPTCHA detected but no proxies configured to rotate! Aborting.');
                    throw new Error('CAPTCHA_BLOCK_NO_PROXY');
                }

                await this.rotateIdentity();

                // Retry navigation with new identity
                return this.getPage(url);
            }

            await this.randomDelay(2000, 4000);
            await this.mimicHuman(page);
            return page;

        } catch (error) {
            console.error('Navigation error in getPage:', error);
            if (page) {
                try { await page.close(); } catch { }
            }
            throw error;
        }
    }

    async parseOrganization(url: string): Promise<string[]> {
        if (!this.browser) await this.init();
        const page = await this.browser.newPage();

        // Use a modern, realistic User Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        try {
            console.log(`Navigating to organization page: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // Critical stealth steps
            await this.randomDelay(3000, 6000);
            await this.mimicHuman(page);

            // Wait for review items
            // Otzovik usually lists reviews in a container. Common class is '.item' for review list items.
            const selector = '.item, .review-title';
            try {
                await page.waitForSelector(selector, { timeout: 10000 });
            } catch (e) {
                console.warn(`Specific selector not found immediately. Capturing page content for debug if needed...`);
            }

            // Extract review links
            const reviewLinks = await page.evaluate(() => {
                const links: string[] = [];
                // Look for links with class 'review-title' which is standard for Otzovik
                const elements = document.querySelectorAll('a.review-title');
                elements.forEach((el) => {
                    const href = el.getAttribute('href');
                    if (href) {
                        // Otzovik links are relative
                        links.push(href.startsWith('http') ? href : `https://otzovik.com${href}`);
                    }
                });
                return links;
            });

            console.log(`Found ${reviewLinks.length} reviews on the page.`);
            return reviewLinks;

        } catch (error) {
            console.error('Error parsing organization page:', error);
            return [];
        } finally {
            await page.close();
        }
    }

    async parseReviewsList(startUrl: string, maxPages: number = 2): Promise<any[]> {
        const allReviews: any[] = [];
        let currentPageUrl = startUrl;
        const MAX_RETRIES_PER_PAGE = 5;
        let pageRetries = 0;

        for (let i = 0; i < maxPages; i++) {
            let page: any = null;
            try {
                // Rotate proxy before each new page (standard behavior)
                // BUT if we are retrying (pageRetries > 0), we definitely want to rotate.
                if (i > 0 || pageRetries > 0) await this.rotateIdentity();

                // Ensure browser exists
                if (!this.browser) await this.launchBrowser();

                page = await this.browser.newPage();

                // Auth if needed
                if (this.currentProxy?.username) {
                    await page.authenticate({ username: this.currentProxy.username, password: this.currentProxy.password });
                }

                await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

                console.log(`Parsing list page ${i + 1} (Attempt ${pageRetries + 1}): ${currentPageUrl}`);
                await page.goto(currentPageUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

                // Stealth adjustments
                await this.randomDelay(3000, 6000);
                await this.mimicHuman(page);

                const selector = '.item.review-item, .item';
                try {
                    await page.waitForSelector(selector, { timeout: 15000 }); // Lower timeout to fail faster
                } catch (e) {
                    // DEBUG: Log what we actually see
                    const title = await page.title();
                    const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 200).replace(/\n/g, ' '));
                    console.warn(`⚠️ List items missing. Title: "${title}". Body: "${bodyText}..."`);

                    if (title.includes('Robot') || title.includes('Captcha') || title.includes('Access denied') || title.includes('робот') || bodyText.includes('Attention') || bodyText.includes('робот')) {
                        throw new Error('Detected Soft Block/Captcha');
                    }
                    throw new Error('Selector Timeout - Invalid Page Content');
                }

                // Extract data from current page
                const pageReviews = await page.evaluate(() => {
                    const items = document.querySelectorAll('.item.review-item, .item');
                    const results: any[] = [];

                    items.forEach((el) => {
                        const getText = (sel: string) => el.querySelector(sel)?.textContent?.trim() || '';


                        if (el.classList.contains('banner')) return;

                        const linkEl = el.querySelector('a.review-title');
                        let reviewUrl = '';
                        let reviewTitle = '';
                        if (linkEl) {
                            const href = linkEl.getAttribute('href');
                            reviewUrl = href ? (href.startsWith('http') ? href : `https://otzovik.com${href}`) : '';
                            reviewTitle = linkEl.textContent?.trim() || '';
                        }
                        if (!reviewUrl) return;

                        const snippet = getText('.review-teaser, .description, .review-body-teaser');
                        const date = getText('.review-postdate, .date');
                        const author = getText('.user-login, .author');
                        let region = '';
                        const userInfoEl = el.querySelector('.user-info');
                        if (userInfoEl) {
                            const divs = userInfoEl.querySelectorAll('div');
                            divs.forEach(d => {
                                if (!d.classList.contains('login-line') && !d.classList.contains('karma-line')) {
                                    const text = d.textContent?.trim();
                                    if (text && text.length > 2) region = text;
                                }
                            });
                        }

                        let rating = 0;
                        const ratingEl = el.querySelector('.rating-score');
                        if (ratingEl) {
                            const valSpan = ratingEl.querySelector('span');
                            if (valSpan && valSpan.textContent) {
                                rating = parseFloat(valSpan.textContent);
                            }
                            if (!rating) {
                                const title = ratingEl.getAttribute('title');
                                if (title) {
                                    const match = title.match(/:\s*(\d+(\.\d+)?)/);
                                    if (match) rating = parseFloat(match[1]);
                                }
                            }
                        }

                        const getMetric = (selector: string) => {
                            const node = el.querySelector(selector);
                            return node ? parseInt(node.textContent?.replace(/\D/g, '') || '0') : 0;
                        };
                        const likes = getMetric('.review-btn.review-yes span');
                        const comments = getMetric('.review-btn.review-comments span[itemprop="commentCount"]');

                        let reviewId = '';
                        const ridMatch = reviewUrl.match(/review_(\d+)/);
                        if (ridMatch) reviewId = ridMatch[1];

                        let productId = '';
                        const postLink = document.querySelector('a[href*="postreview.php?pid="]');
                        if (postLink) {
                            const pidMatch = postLink.getAttribute('href')?.match(/pid=(\d+)/);
                            if (pidMatch) productId = pidMatch[1];
                        }

                        let category = '';
                        const breadcrumbs = document.querySelector('.breadcrumbs');
                        if (breadcrumbs) category = breadcrumbs.textContent?.replace(/\n/g, ' ').trim() || '';

                        results.push({
                            id: reviewId, title: reviewTitle, url: reviewUrl, snippet, author, region, date, rating, likes, comments, productId, category
                        });
                    });
                    return results;
                });

                console.log(`Found ${pageReviews.length} reviews on page ${i + 1}`);
                allReviews.push(...pageReviews);

                // Success! Reset retries for next page
                pageRetries = 0;

                if (i < maxPages - 1) {
                    const nextLink = await page.evaluate(() => {
                        const nextBtn = document.querySelector('a.next, a.pager-next');
                        return nextBtn ? nextBtn.getAttribute('href') : null;
                    });
                    if (nextLink) {
                        currentPageUrl = nextLink.startsWith('http') ? nextLink : `https://otzovik.com${nextLink}`;
                    } else {
                        console.log('No next page found. Stopping.');
                        break;
                    }
                }

            } catch (error: any) {
                console.error(`Error processing list page ${i + 1}:`, error);

                if (pageRetries < MAX_RETRIES_PER_PAGE) {
                    console.warn(`♻️ Logic: Page failed. Rotating & Retrying (${pageRetries + 1}/${MAX_RETRIES_PER_PAGE})...`);
                    pageRetries++;
                    i--; // Decrement i so the loop repeats the SAME page index
                    // Close page and continue loop, which will hit 'rotateIdentity' at start
                } else {
                    console.error(`❌ Failed page ${i + 1} after ${MAX_RETRIES_PER_PAGE} retries. Moving on/Stopping.`);
                    if (i === 0) throw error; // Fatal if first page
                    // Else break or continue? If we break we lose subsequent pages.
                    // But if we can't get page X, we probably can't get next.
                    break;
                }

            } finally {
                if (page) {
                    try { await page.close(); } catch (e) {
                        console.error('Error closing list page:', e);
                    }
                }
            }
        }
        return allReviews;
    }

    async parseReview(url: string): Promise<any> {
        // if (!this.browser) await this.init(); // getPage handles this
        let page: any = null;

        try {
            console.log(`Parsing review: ${url}`);
            page = await this.getPage(url);

            // Wait for review content
            await page.waitForSelector('.review-body', { timeout: 30000 });

            const data = await page.evaluate(() => {
                // Helper to safely get text
                const getText = (selector: string) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent?.trim() || '' : '';
                };

                // Helper to get attribute
                const getAttr = (selector: string, attr: string) => {
                    const el = document.querySelector(selector);
                    return el ? el.getAttribute(attr) || '' : '';
                };

                // Helper to get number from selector
                const getNumber = (selector: string) => {
                    const text = getText(selector);
                    const num = parseInt(text.replace(/\D/g, ''));
                    return isNaN(num) ? 0 : num;
                };

                // 1. IDs
                const reviewId = getAttr('.review-contents', 'data-rid');
                const productId = getAttr('.review-contents', 'data-pid');

                // 2. URLs
                const reviewUrl = getAttr('[itemprop="url"]', 'content');
                const discussionUrl = getAttr('[itemprop="discussionUrl"]', 'content');

                // 3. Dates
                const datePublished = getAttr('meta[itemprop="datePublished"]', 'content');
                const dateText = getText('.review-postdate span:not(.value)');

                // 4. Author Information
                let profileUrl = getAttr('.user-info meta[itemprop="url"]', 'content') || getAttr('.user-login', 'href');
                if (profileUrl && !profileUrl.startsWith('http')) {
                    profileUrl = 'https://otzovik.com' + profileUrl;
                }

                const author = {
                    name: getText('.user-login [itemprop="name"]') || getText('.user-login'),
                    profileUrl: profileUrl,
                    avatar: getAttr('.avatar img[itemprop="image"]', 'src'),
                    karma: getNumber('.karma-col .karma'),
                    location: getText('.user-location'),
                    totalReviews: getNumber('.reviews-col .reviews-counter')
                };

                // 5. Rating
                const ratingValue = parseFloat(getAttr('[itemprop="reviewRating"] [itemprop="ratingValue"]', 'content') || '0');
                const rating = {
                    value: ratingValue,
                    min: parseInt(getAttr('[itemprop="reviewRating"] [itemprop="worstRating"]', 'content') || '1'),
                    max: parseInt(getAttr('[itemprop="reviewRating"] [itemprop="bestRating"]', 'content') || '5')
                };

                // 6. Content
                const h1 = getText('h1');
                const summary = getText('.summary') || getText('[itemprop="name"]');
                const text = getText('.review-body.description') || getText('.review-body');

                // Remove <b> tags from pros/cons
                const prosEl = document.querySelector('.review-plus');
                const consEl = document.querySelector('.review-minus');
                let pros = '';
                let cons = '';

                if (prosEl) {
                    const boldEl = prosEl.querySelector('b');
                    if (boldEl) boldEl.remove();
                    pros = prosEl.textContent?.trim() || '';
                }

                if (consEl) {
                    const boldEl = consEl.querySelector('b');
                    if (boldEl) boldEl.remove();
                    cons = consEl.textContent?.trim() || '';
                }

                const content = {
                    title: h1,
                    summary: summary,
                    text: text,
                    pros: pros,
                    cons: cons
                };

                // 7. Metrics
                const likes = getNumber('.review-bar .review-yes span:last-child');
                const comments = parseInt(getAttr('meta[itemprop="commentCount"]', 'content') || '0');
                const recommendText = getText('.recommend-ratio');
                const recommended = recommendText.toLowerCase().includes('да') || recommendText.toLowerCase().includes('yes');

                const metrics = {
                    likes: likes,
                    comments: comments,
                    recommended: recommended
                };

                // 8. Product Information
                const productName = getText('.product-name [itemprop="name"]') || getText('.product-name');
                let productUrl = getAttr('.product-name a', 'href') || getAttr('.products-cogtent meta[itemprop="url"]', 'content');
                if (productUrl && !productUrl.startsWith('http')) {
                    productUrl = 'https://otzovik.com' + productUrl;
                }
                const category = getAttr('.category', 'title');
                const breadcrumbs = getText('.breadcrumbs');
                const productImage = getAttr('.product-photo img[itemprop="image"]', 'src');

                // Aggregate rating from product
                const avgRating = parseFloat(getAttr('[itemprop="aggregateRating"] [itemprop="ratingValue"]', 'content') || '0');
                const totalReviews = parseInt(getAttr('[itemprop="aggregateRating"] [itemprop="reviewCount"]', 'content') || '0');

                const product = {
                    name: productName,
                    url: productUrl,
                    category: category,
                    breadcrumbs: breadcrumbs,
                    averageRating: avgRating,
                    totalReviews: totalReviews,
                    image: productImage
                };

                return {
                    id: reviewId,
                    productId: productId,
                    url: reviewUrl,
                    discussionUrl: discussionUrl,
                    datePublished: datePublished,
                    dateText: dateText,
                    author: author,
                    rating: rating,
                    content: content,
                    metrics: metrics,
                    product: product
                };
            });

            if (!data.content.text) {
                console.warn(`[Parser] Warning: Empty review text for ${url}`);
            }

            return data;

        } catch (error) {
            console.error(`Error parsing review ${url}:`, error);
            return null;
        } finally {
            if (page) {
                try {
                    await page.close();
                } catch (e) { console.error('Error closing page (parseReview):', e); }
            }
        }
    }
}
