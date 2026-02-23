/**
 * Cleaner module for RAG pipeline
 * Removes ads, scripts, HTML artifacts from review text
 */

// Patterns to remove from review text
const CLEANUP_PATTERNS = [
    // Ad scripts
    /\(adsbygoogle\s*=\s*window\.adsbygoogle\s*\|\|\s*\[\]\)\.push\(\{\}\);?/gi,
    /adsbygoogle[^;]*;/gi,

    // Common ad/tracking patterns
    /google\.ads\.[^;]+;/gi,
    /googletag\.[^;]+;/gi,
    /yaCounter\d+/gi,

    // Script blocks
    /<script[^>]*>[\s\S]*?<\/script>/gi,

    // HTML tags
    /<[^>]+>/g,

    // HTML entities
    /&nbsp;/gi,
    /&amp;/gi,
    /&lt;/gi,
    /&gt;/gi,
    /&quot;/gi,
    /&#\d+;/gi,

    // Otzovik specific patterns
    /Подробнее[А-Яа-яЁё\s]+Образование/gi,
    /Подробнее[А-Яа-яЁё\s]+принадлежности/gi,

    // Multiple whitespace
    /\s{2,}/g,

    // Multiple newlines
    /\n{3,}/g
];

/**
 * Clean review text from ads, scripts, and HTML artifacts
 */
export function cleanText(text: string): string {
    if (!text) return '';

    let cleaned = text;

    for (const pattern of CLEANUP_PATTERNS) {
        cleaned = cleaned.replace(pattern, ' ');
    }

    // Normalize whitespace
    cleaned = cleaned
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim();

    return cleaned;
}

/**
 * Clean pros/cons text (simpler version)
 */
export function cleanProsConc(text: string): string {
    if (!text) return '';

    return text
        .replace(/<[^>]+>/g, '')
        .replace(/Достоинства:\s*/i, '')
        .replace(/Недостатки:\s*/i, '')
        .trim();
}

/**
 * Full review data cleaner
 */
export interface RawReview {
    id: string;
    productId: string;
    url?: string;
    datePublished?: string;
    dateText?: string;
    author: {
        name: string;
        profileUrl?: string;
        avatar?: string;
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
        url?: string;
        category: string;
        breadcrumbs?: string;
        averageRating: number;
        totalReviews: number;
        image?: string;
    };
}

export interface CleanedReview extends RawReview {
    cleanedContent: {
        title: string;
        summary: string;
        text: string;
        pros: string;
        cons: string;
        searchContent: string; // Synthetic field for better vector search
    };
}

/**
 * Clean entire review object
 */
export function cleanReview(raw: RawReview): CleanedReview {
    const cleanedTitle = cleanText(raw.content.title);
    const cleanedSummary = cleanText(raw.content.summary);
    const cleanedText = cleanText(raw.content.text);
    const cleanedPros = cleanProsConc(raw.content.pros);
    const cleanedCons = cleanProsConc(raw.content.cons);

    // Create synthetic search content for better embeddings
    const searchContent = [
        `[PRODUCT]: ${raw.product.name}`,
        `[CATEGORY]: ${raw.product.category}`,
        `[RATING]: ${raw.rating.value}/${raw.rating.max}`,
        cleanedPros ? `[PROS]: ${cleanedPros}` : '',
        cleanedCons ? `[CONS]: ${cleanedCons}` : '',
        cleanedSummary ? `[SUMMARY]: ${cleanedSummary}` : ''
    ].filter(Boolean).join('\n');

    return {
        ...raw,
        cleanedContent: {
            title: cleanedTitle,
            summary: cleanedSummary,
            text: cleanedText,
            pros: cleanedPros,
            cons: cleanedCons,
            searchContent
        }
    };
}

/**
 * Batch clean reviews
 */
export function cleanReviews(reviews: RawReview[]): CleanedReview[] {
    return reviews.map(cleanReview);
}
