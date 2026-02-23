import { OtzovikParser } from './parsers/otzovik';
import * as fs from 'fs';
import * as path from 'path';

async function testOtzovikReview() {
    console.log('Starting Otzovik Review Detail Test...\n');

    const parser = new OtzovikParser();

    try {
        await parser.init();

        // Test URL provided by user
        const reviewUrl = 'https://otzovik.com/review_13043302.html';
        const review = await parser.parseReview(reviewUrl);

        if (review) {
            console.log('\n=== Parsed Review Data ===\n');
            console.log(JSON.stringify(review, null, 2));

            // Save to file
            const outputPath = path.join(process.cwd(), 'otzovik_review_detail_test.json');
            fs.writeFileSync(outputPath, JSON.stringify(review, null, 2), 'utf-8');
            console.log(`\n✅ Saved review to ${outputPath}`);
        } else {
            console.error('❌ Failed to parse review');
        }

    } catch (error) {
        console.error('Error during test:', error);
    } finally {
        await parser.close();
    }
}

testOtzovikReview();
