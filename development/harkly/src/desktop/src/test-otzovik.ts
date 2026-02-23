import { OtzovikParser } from './parsers/otzovik';

async function main() {
    const parser = new OtzovikParser();
    const targetUrl = 'https://otzovik.com/reviews/skyeng_ru-shkola_izucheniya_inostrannogo_yazika_cherez_internet/';

    try {
        console.log('Starting Otzovik Parser Test...');
        await parser.init();

        // Step 1: Parse Organization Page
        const reviewLinks = await parser.parseOrganization(targetUrl);

        if (reviewLinks.length === 0) {
            console.log('No reviews found. Check selectors or bot protection.');
        } else {
            console.log(`Found ${reviewLinks.length} reviews. Parsing first 3...`);

            // Step 2: Parse individual reviews (limit to 3 for test)
            for (const link of reviewLinks.slice(0, 3)) {
                console.log('-----------------------------------');
                const reviewData = await parser.parseReview(link);
                if (reviewData) {
                    console.log('Review Parsed Successfully:');
                    console.log(`Product: ${reviewData.product_name}`);
                    console.log(`Title: ${reviewData.review_title}`);
                    console.log(`Author: ${reviewData.author}`);
                    console.log(`Date: ${reviewData.date}`);
                    console.log(`Rating: ${reviewData.rating}`);
                    console.log(`Pros: ${reviewData.pros}`);
                    console.log(`Cons: ${reviewData.cons}`);
                    console.log(`Text Length: ${reviewData.text?.length || 0} chars`);
                    console.log(`Snippet: ${reviewData.text?.substring(0, 100)}...`);
                }
            }
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await parser.close();
    }
}

main();
