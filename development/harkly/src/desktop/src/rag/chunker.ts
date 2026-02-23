/**
 * Semantic Chunker for RAG pipeline
 * Splits reviews into meaningful chunks for better retrieval
 */

import { CleanedReview } from './cleaner';

export interface ReviewChunk {
    id: string;              // Unique chunk ID
    reviewId: string;        // Parent review ID
    productId: string;       // Product ID for filtering

    type: 'pros' | 'cons' | 'summary' | 'text' | 'search';
    content: string;

    // Metadata for filtering
    rating: number;
    datePublished: string | null;
    authorKarma: number;
    recommended: boolean;

    // For parent-child retrieval
    parentContent?: string;  // Full text for context
}

/**
 * Configuration for chunking
 */
export interface ChunkConfig {
    maxChunkSize: number;    // Max tokens per chunk
    overlapSize: number;     // Overlap between text chunks
    includeParent: boolean;  // Include parent content
}

const DEFAULT_CONFIG: ChunkConfig = {
    maxChunkSize: 500,
    overlapSize: 100,
    includeParent: true
};

/**
 * Estimate token count (rough approximation)
 * Russian text: ~1.5 chars per token average
 */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 1.5);
}

/**
 * Split text into overlapping chunks
 */
function splitTextIntoChunks(
    text: string,
    maxTokens: number,
    overlap: number
): string[] {
    const chunks: string[] = [];
    const charsPerToken = 1.5;
    const maxChars = Math.floor(maxTokens * charsPerToken);
    const overlapChars = Math.floor(overlap * charsPerToken);

    if (text.length <= maxChars) {
        return [text];
    }

    let start = 0;
    while (start < text.length) {
        let end = Math.min(start + maxChars, text.length);

        // Try to break at sentence boundary
        if (end < text.length) {
            const lastPeriod = text.lastIndexOf('.', end);
            const lastExclaim = text.lastIndexOf('!', end);
            const lastQuestion = text.lastIndexOf('?', end);
            const breakPoint = Math.max(lastPeriod, lastExclaim, lastQuestion);

            if (breakPoint > start + maxChars / 2) {
                end = breakPoint + 1;
            }
        }

        chunks.push(text.slice(start, end).trim());
        start = end - overlapChars;

        if (start >= text.length - overlapChars) break;
    }

    return chunks.filter(c => c.length > 0);
}

/**
 * Create semantic chunks from a cleaned review
 */
export function chunkReview(
    review: CleanedReview,
    config: ChunkConfig = DEFAULT_CONFIG
): ReviewChunk[] {
    const chunks: ReviewChunk[] = [];
    const baseMetadata = {
        reviewId: review.id,
        productId: review.productId,
        rating: review.rating.value,
        datePublished: review.datePublished || null,
        authorKarma: review.author.karma,
        recommended: review.metrics.recommended,
        parentContent: config.includeParent
            ? review.cleanedContent.text.slice(0, 2000)
            : undefined
    };

    // Chunk 1: Pros (if exists)
    if (review.cleanedContent.pros && review.cleanedContent.pros.length > 10) {
        chunks.push({
            id: `${review.id}_pros`,
            type: 'pros',
            content: review.cleanedContent.pros,
            ...baseMetadata
        });
    }

    // Chunk 2: Cons (if exists)
    if (review.cleanedContent.cons && review.cleanedContent.cons.length > 10) {
        chunks.push({
            id: `${review.id}_cons`,
            type: 'cons',
            content: review.cleanedContent.cons,
            ...baseMetadata
        });
    }

    // Chunk 3: Summary (if exists)
    if (review.cleanedContent.summary && review.cleanedContent.summary.length > 10) {
        chunks.push({
            id: `${review.id}_summary`,
            type: 'summary',
            content: review.cleanedContent.summary,
            ...baseMetadata
        });
    }

    // Chunk 4: Search content (synthetic, always created)
    chunks.push({
        id: `${review.id}_search`,
        type: 'search',
        content: review.cleanedContent.searchContent,
        ...baseMetadata
    });

    // Chunk 5+: Full text (split if too long)
    const fullText = review.cleanedContent.text;
    if (fullText && fullText.length > 20) {
        const textChunks = splitTextIntoChunks(
            fullText,
            config.maxChunkSize,
            config.overlapSize
        );

        textChunks.forEach((text, idx) => {
            chunks.push({
                id: `${review.id}_text_${idx}`,
                type: 'text',
                content: text,
                ...baseMetadata
            });
        });
    }

    return chunks;
}

/**
 * Batch chunk multiple reviews
 */
export function chunkReviews(
    reviews: CleanedReview[],
    config?: ChunkConfig
): ReviewChunk[] {
    return reviews.flatMap(review => chunkReview(review, config));
}

/**
 * Get statistics about chunks
 */
export function getChunkStats(chunks: ReviewChunk[]) {
    const byType: Record<string, number> = {};
    let totalTokens = 0;

    chunks.forEach(chunk => {
        byType[chunk.type] = (byType[chunk.type] || 0) + 1;
        totalTokens += estimateTokens(chunk.content);
    });

    return {
        totalChunks: chunks.length,
        byType,
        estimatedTokens: totalTokens,
        avgTokensPerChunk: Math.round(totalTokens / chunks.length)
    };
}
