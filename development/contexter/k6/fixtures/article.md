# Understanding Retrieval-Augmented Generation

## Introduction

Retrieval-Augmented Generation (RAG) is a technique that enhances large language models by providing them with relevant context retrieved from a knowledge base. This approach combines the strengths of information retrieval with the generative capabilities of LLMs.

## How RAG Works

The RAG pipeline consists of several stages:

1. **Document Ingestion**: Documents are uploaded and processed through a pipeline that extracts text, chunks it into manageable pieces, and creates vector embeddings.

2. **Chunking**: Large documents are split into smaller chunks using various strategies:
   - Semantic chunking based on topic boundaries
   - Hierarchical chunking with parent-child relationships
   - Table-aware chunking for structured data
   - Timestamp-based chunking for audio/video transcripts

3. **Embedding**: Each chunk is converted into a dense vector representation using models like Jina v4, which supports late chunking for better contextual understanding.

4. **Indexing**: Vectors are stored in a vector database (pgvector) alongside full-text search indexes (tsvector) for hybrid retrieval.

## Query Processing

When a user submits a query:

1. The query is rewritten into multiple variants to improve recall
2. Query variants are embedded using the same model
3. Hybrid search combines vector similarity with BM25 text matching
4. Results are reranked using a cross-encoder for precision
5. MMR diversity filtering removes redundant results
6. Context is assembled and sent to an LLM for answer generation

## Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Precision@K | Fraction of relevant results in top K | > 0.8 |
| Recall@K | Fraction of all relevant results found | > 0.7 |
| MRR | Mean reciprocal rank of first relevant result | > 0.85 |
| Faithfulness | Answer grounded in retrieved context | > 0.9 |
| Latency | End-to-end query time | < 5s |

## Best Practices

- Use contextual prefixes to provide document-level context to each chunk
- Implement deduplication to avoid indexing similar content multiple times
- Monitor embedding drift to detect distribution shifts over time
- Apply content filtering to flag potential prompt injection attempts
- Use circuit breakers to handle external API failures gracefully

## Conclusion

RAG systems bridge the gap between static knowledge bases and dynamic language models, enabling applications that can answer questions accurately using up-to-date information from custom document collections.
