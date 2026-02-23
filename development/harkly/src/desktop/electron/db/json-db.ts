
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

interface Review {
    id: string;
    [key: string]: any;
}

interface Chunk {
    id: string;
    review_id: string;
    chunk_content: string;
    chunk_type: string;
    embedding?: any;
}

interface DatabaseSchema {
    source_reviews: Review[];
    knowledge_chunks: Chunk[];
}

let dbPath: string = '';
let currentData: DatabaseSchema = { source_reviews: [], knowledge_chunks: [] };

export const initDB = (dbName: string = 'knowledge_base') => {
    // Ensure .json extension
    const fileName = dbName.endsWith('.json') ? dbName : `${dbName}.json`;

    // Determine DB path
    const userDataPath = app.getPath('userData');

    // Create userData dir if not exists (should exist in production)
    if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
    }

    dbPath = path.join(userDataPath, fileName);
    console.log(`[JSON-DB] Initializing database at ${dbPath}`);

    // Load existing data or create new
    if (fs.existsSync(dbPath)) {
        try {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            currentData = JSON.parse(fileContent);
            if (!currentData.source_reviews) currentData.source_reviews = [];
            if (!currentData.knowledge_chunks) currentData.knowledge_chunks = [];
        } catch (e) {
            console.error('[JSON-DB] Error reading database, creating new:', e);
            currentData = { source_reviews: [], knowledge_chunks: [] };
            saveToFile();
        }
    } else {
        saveToFile();
    }

    return dbPath;
};

const saveToFile = () => {
    if (!dbPath) return;
    try {
        // Atomic write via temp file could be safer, but direct write is OK for this scale
        fs.writeFileSync(dbPath, JSON.stringify(currentData, null, 2), 'utf-8');
    } catch (e) {
        console.error('[JSON-DB] Error saving database:', e);
    }
};

export const saveReview = (review: any) => {
    if (!dbPath) initDB();

    const existingIndex = currentData.source_reviews.findIndex(r => r.id === review.id);

    // Flatten structure to match old SQLite behavior if needed, 
    // or just store the full object. Storing the full object is better for JSON.
    // However, the previous code mapped it to flat columns. 
    // Let's keep the flat structure for compatibility with export scripts.

    const flatReview: Review = {
        id: review.id,
        productId: review.product.url, // productId
        url: review.url,
        title: review.content.title,
        author: review.author.name,
        rating: review.rating.value,
        full_text: review.content.text,
        pros: review.content.pros,
        cons: review.content.cons,
        summary: review.content.summary,
        date_published: review.datePublished,
        likes: review.metrics.likes,
        recommended: review.metrics.recommended ? 1 : 0,
        created_at: new Date().toISOString()
    };

    if (existingIndex >= 0) {
        currentData.source_reviews[existingIndex] = flatReview;
    } else {
        currentData.source_reviews.push(flatReview);
    }

    saveToFile();
    console.log(`[JSON-DB] Saved review ${review.id}`);
};

export const getStats = (): Promise<{ reviews: number }> => {
    return new Promise((resolve) => {
        if (!dbPath) initDB();
        resolve({ reviews: currentData.source_reviews.length });
    });
};

export const checkReviewExists = (id: string): Promise<boolean> => {
    return new Promise((resolve) => {
        if (!dbPath) initDB();
        const exists = currentData.source_reviews.some(r => r.id === id);
        resolve(exists);
    });
};

export const getAllReviews = (): Promise<any[]> => {
    return new Promise((resolve) => {
        if (!dbPath) initDB();
        resolve(currentData.source_reviews);
    });
};

export const saveChunk = (chunk: { id: string, review_id: string, content: string, type: string }) => {
    if (!dbPath) initDB();

    const existingIndex = currentData.knowledge_chunks.findIndex(c => c.id === chunk.id);
    const newChunk: Chunk = {
        id: chunk.id,
        review_id: chunk.review_id,
        chunk_content: chunk.content,
        chunk_type: chunk.type
    };

    if (existingIndex >= 0) {
        currentData.knowledge_chunks[existingIndex] = newChunk;
    } else {
        currentData.knowledge_chunks.push(newChunk);
    }

    saveToFile();
};
