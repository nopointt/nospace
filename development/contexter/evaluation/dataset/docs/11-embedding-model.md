# Embedding Model: Jina v4

## Model Details

- **Name:** jina-embeddings-v4
- **Provider:** Jina AI (Berlin, Germany)
- **Architecture:** Transformer with Matryoshka Representation Learning (MRL)
- **Native Dimensions:** 1024
- **Truncated Dimensions:** 512 (used in Contexter)
- **Quality Retention:** 99.7% nDCG@10 at 512 dims vs 1024

## Why Jina v4

Jina v4 was chosen over alternatives for several reasons:
1. Late chunking support — embeds chunks with awareness of surrounding document context
2. MRL — allows truncating vectors to save storage without significant quality loss
3. Multilingual — supports 100+ languages with a single model
4. Cost effective — $0.02 per million tokens on paid tier

## Late Chunking

Late chunking is a technique where multiple chunks from the same document are embedded together in a single API call. The model uses attention across all chunks, producing vectors that capture inter-chunk relationships.

Configuration in Contexter:
- Token cap per batch: 8,192 tokens
- If a single chunk exceeds the cap, it is embedded individually
- Single-chunk batches skip late_chunking flag (identical result, less overhead)

## Embedding Cache

The CachedEmbedderService stores embeddings in Redis with SHA-256 content-based keys. This avoids re-embedding identical text during re-indexing or duplicate document uploads.

Cache key format: `embed:{sha256(text)}:{dimensions}`
TTL: No expiration (embeddings are deterministic for the same model + text)

## Comparison with Alternatives

| Model | Dims | Late Chunking | MRL | Cost/1M tokens |
|---|---|---|---|---|
| Jina v4 | 1024 (512 MRL) | Yes | Yes | $0.02 |
| OpenAI text-embedding-3-large | 3072 | No | No | $0.13 |
| Cohere embed-v3 | 1024 | No | Yes | $0.10 |
| Voyage AI voyage-3 | 1024 | No | No | $0.06 |
