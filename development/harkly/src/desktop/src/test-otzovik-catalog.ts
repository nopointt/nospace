import { OtzovikParser } from './parsers/otzovik';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
    const parser = new OtzovikParser();
    const targetUrl = 'https://otzovik.com/reviews/skyeng_ru-shkola_izucheniya_inostrannogo_yazika_cherez_internet/';

    try {
        console.log('Starting Otzovik Catalog Test...');
        await parser.init();

        // Parse first 2 pages
        const reviews = await parser.parseReviewsList(targetUrl, 2);

        console.log(`Total reviews collected: ${reviews.length}`);

        if (reviews.length > 0) {
            console.log('Sample Review (first item):');
            console.log(JSON.stringify(reviews[0], null, 2));

            // Save to JSON
            const outFile = path.join(__dirname, '..', 'otzovik_reviews_test.json');
            fs.writeFileSync(outFile, JSON.stringify(reviews, null, 2));
            console.log(`Saved reviews to ${outFile}`);
        } else {
            console.log('No reviews found.');
        }

    } catch (error) {
        console.error('Fatal Error:', error);
    } finally {
        await parser.close();
    }
}

main();
