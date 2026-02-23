import { IrecommendParser } from './parsers/irecommend';

async function main() {
    const parser = new IrecommendParser();
    // Skyeng page on Irecommend
    const targetUrl = 'https://irecommend.ru/content/skyeng-online-school-of-english';

    try {
        console.log('Starting Irecommend Parser Test...');
        await parser.init();

        const reviewLinks = await parser.parseOrganization(targetUrl);

        if (reviewLinks.length === 0) {
            console.log('No reviews found. Check selectors or bot protection.');
        } else {
            console.log(`Found ${reviewLinks.length} reviews. Parsing first 3...`);

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
