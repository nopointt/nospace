
import * as fs from 'fs';
import * as path from 'path';
import { cleanReview, CleanedReview } from './rag/cleaner';
import { chunkReview, getChunkStats, ReviewChunk } from './rag/chunker';
import { exportReviewsToMarkdown } from './rag/exporter';

// Interface matching the output of our Otzovik review parser
interface ReviewData {
    id: string;
    productId: string;
    url: string;
    datePublished: string;
    dateText: string;
    author: {
        name: string;
        profileUrl: string;
        avatar: string;
        karma: number;
        location: string;
        totalReviews: number;
    };
    rating: {
        value: number;
        min: number;
        max: number;
    };
    content: {
        title: string;
        summary: string;
        text: string;
        pros: string;
        cons: string;
    };
    metrics: {
        likes: number;
        comments: number;
        recommended: boolean;
    };
    product: {
        name: string;
        url: string;
        category: string;
        breadcrumbs: string;
        averageRating: number;
        totalReviews: number;
        image: string;
    };
}

async function testRagPipeline() {
    console.log('🧪 Starting RAG Pipeline Test...\n');

    // 1. Load Test Data
    const inputPath = path.join(process.cwd(), 'otzovik_review_detail_test.json');
    if (!fs.existsSync(inputPath)) {
        console.error(`❌ Input file not found: ${inputPath}`);
        return;
    }

    console.log(`📂 Loading review from: ${inputPath}`);
    const rawData = fs.readFileSync(inputPath, 'utf-8');
    const review: ReviewData = JSON.parse(rawData);

    // 2. Data Cleaning
    console.log('\n🧹 Cleaning Data...');
    const cleanedReview = cleanReview(review);

    console.log(`   Title: "${cleanedReview.cleanedContent.title}"`);
    console.log(`   Summary: "${cleanedReview.cleanedContent.summary}"`);
    console.log(`   Pros: "${cleanedReview.cleanedContent.pros}"`);
    console.log(`   Cons: "${cleanedReview.cleanedContent.cons}"`);
    // Preview search content
    console.log('\n🔍 Generated Search Content (Preview):');
    console.log(cleanedReview.cleanedContent.searchContent
        .split('\n')
        .map(line => '   ' + line)
        .join('\n')
    );

    // 3. Semantic Chunking
    console.log('\n🔪 Generating Semantic Chunks...');
    const chunks = chunkReview(cleanedReview);

    // 4. Output Stats
    const stats = getChunkStats(chunks);
    console.log('\n📊 Chunk Statistics:');
    console.log(`   Total Chunks: ${stats.totalChunks}`);
    console.log(`   By Type: ${JSON.stringify(stats.byType)}`);
    console.log(`   Avg Tokens: ${stats.avgTokensPerChunk}`);

    // 5. Inspect Chunks
    console.log('\n📑 Chunk Details:');
    chunks.forEach((chunk, i) => {
        console.log(`\n   [Chunk ${i + 1}] ID: ${chunk.id} (${chunk.type})`);
        console.log(`   Content Preview: "${chunk.content.slice(0, 80).replace(/\n/g, ' ')}..."`);
        console.log(`   Metadata: Rating=${chunk.rating}, Karma=${chunk.authorKarma}`);
    });

    // 6. Save Processed Data (Simulate DB Storage)
    const outputPath = path.join(process.cwd(), 'rag_processed_output.json');
    const outputData = {
        original: review,
        cleaned: cleanedReview,
        chunks: chunks
    };

    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');
    console.log(`\n✅ Pipeline complete! Processed data saved to: ${outputPath}`);

    // 7. Export to Markdown Knowledge Base
    console.log('\n📚 Generating Knowledge Base (Markdown)...');
    exportReviewsToMarkdown([cleanedReview], { outputDir: 'knowledge_base' });
}

testRagPipeline();
