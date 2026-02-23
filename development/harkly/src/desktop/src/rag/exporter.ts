
import * as fs from 'fs';
import * as path from 'path';
import { CleanedReview } from './cleaner';

/**
 * Interface for Markdown export options
 */
export interface ExportOptions {
    outputDir: string;
    includeFrontmatter: boolean;
    groupByProduct: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
    outputDir: 'knowledge_base',
    includeFrontmatter: true,
    groupByProduct: true
};

/**
 * Escapes text for Markdown
 */
function escapeMd(text: string): string {
    return text ? text.replace(/"/g, '\\"') : '';
}

/**
 * Generates frontmatter YAML block
 */
function generateFrontmatter(review: CleanedReview): string {
    return `---
id: "${review.id}"
product_id: "${review.productId}"
product_name: "${escapeMd(review.product.name)}"
category: "${escapeMd(review.product.category)}"
rating: ${review.rating.value}
author: "${escapeMd(review.author.name)}"
date: "${review.datePublished}"
likes: ${review.metrics.likes}
recommended: ${review.metrics.recommended}
url: "${review.url}"
---
`;
}

/**
 * Generates the Markdown content for a single review
 */
function generateReviewMarkdown(review: CleanedReview): string {
    const fm = generateFrontmatter(review);
    const content = review.cleanedContent;

    // Build the Markdown body
    const body = `
# Review: ${content.title}

**Summary**: ${content.summary}

## Pros
${content.pros || 'No pros listed.'}

## Cons
${content.cons || 'No cons listed.'}

## Full Text
${content.text}

---
*Product: ${review.product.name} | Rating: ${review.rating.value}/5 | Date: ${review.dateText}*
`;

    return fm + body;
}

/**
 * Exports reviews to Markdown files
 */
export function exportReviewsToMarkdown(
    reviews: CleanedReview[],
    options: Partial<ExportOptions> = {}
): void {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Ensure output directory exists
    const rootDir = path.resolve(process.cwd(), opts.outputDir);
    if (!fs.existsSync(rootDir)) {
        fs.mkdirSync(rootDir, { recursive: true });
    }

    reviews.forEach(review => {
        let saveDir = rootDir;

        // Group by product if requested
        if (opts.groupByProduct) {
            // Safe folder name from product name
            const safeProductName = review.product.name
                .replace(/[^a-z0-9а-яё]/gi, '_')
                .replace(/_+/g, '_')
                .slice(0, 50);

            saveDir = path.join(rootDir, safeProductName);
            if (!fs.existsSync(saveDir)) {
                fs.mkdirSync(saveDir, { recursive: true });
            }
        }

        // Generate filename
        const filename = `review_${review.id}.md`;
        const filePath = path.join(saveDir, filename);

        // Generate content
        const markdown = generateReviewMarkdown(review);

        // Write file
        fs.writeFileSync(filePath, markdown, 'utf-8');
    });

    console.log(`\n📦 Exported ${reviews.length} reviews to ${rootDir}`);
}
