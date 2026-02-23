import puppeteer from 'puppeteer';

export class IrecommendParser {
    private browser: any;

    async init() {
        this.browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: { width: 1366, height: 768 }
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    private async randomDelay(min: number = 2000, max: number = 5000) {
        const delay = Math.floor(Math.random() * (max - min + 1) + min);
        await new Promise(r => setTimeout(r, delay));
    }

    async parseOrganization(url: string): Promise<string[]> {
        if (!this.browser) await this.init();
        const page = await this.browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        try {
            console.log(`Navigating to Irecommend organization: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await this.randomDelay(3000, 5000);

            // Irecommend usually lists reviews. 
            // Often links to reviews are in `.reviewTitle a` or similar.
            const selector = '.reviewTitle';
            try {
                // Wait for at least one review title
                await page.waitForSelector(selector, { timeout: 10000 });
            } catch (e) {
                console.warn(`Selector ${selector} not found. Could be different layout or captcha.`);
            }

            const reviewLinks = await page.evaluate(() => {
                const links: string[] = [];
                const elements = document.querySelectorAll('.reviewTitle a');
                elements.forEach((el) => {
                    const href = el.getAttribute('href');
                    if (href) {
                        links.push(href.startsWith('http') ? href : `https://irecommend.ru${href}`);
                    }
                });
                return links;
            });

            console.log(`Found ${reviewLinks.length} reviews on the page.`);
            return reviewLinks;

        } catch (error) {
            console.error('Error parsing Irecommend organization page:', error);
            return [];
        } finally {
            await page.close();
        }
    }

    async parseReview(url: string): Promise<any> {
        if (!this.browser) await this.init();
        const page = await this.browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        try {
            console.log(`Parsing review: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await this.randomDelay(2000, 4000);

            await page.waitForSelector('[itemprop="reviewBody"]', { timeout: 10000 });

            const data = await page.evaluate(() => {
                const getText = (selector: string) => {
                    const el = document.querySelector(selector);
                    return el ? el.textContent?.trim() || '' : '';
                };
                const getAttr = (selector: string, attr: string) => {
                    const el = document.querySelector(selector);
                    return el ? el.getAttribute(attr) || '' : '';
                };

                const product_name = getText('[itemprop="itemReviewed"] [itemprop="name"]') || getText('.productName');
                const review_title = getText('.reviewTitle') || getText('h1');
                const text = getText('[itemprop="reviewBody"]') || getText('.reviewText');

                const author = getText('[itemprop="author"] [itemprop="name"]') || getText('.authorName');
                const date = getText('[itemprop="datePublished"]') || getText('.dtreviewed');

                const pros = getText('.plus ul') || getText('.review-plus');
                const cons = getText('.minus ul') || getText('.review-minus');

                let rating = 0;
                const ratingContent = getAttr('[itemprop="reviewRating"] [itemprop="ratingValue"]', 'content');
                if (ratingContent) {
                    rating = parseFloat(ratingContent);
                } else {
                    // Check stars count if meta not present
                    const stars = document.querySelectorAll('.starsRating .on');
                    if (stars && stars.length > 0) rating = stars.length;
                }

                return {
                    author,
                    rating,
                    text,
                    date,
                    pros,
                    cons,
                    product_name,
                    review_title,
                    source_url: document.location.href
                };
            });

            return data;

        } catch (error) {
            console.error(`Error parsing review ${url}:`, error);
            return null;
        } finally {
            await page.close();
        }
    }
}
