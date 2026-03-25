# RAG Service Hosting — Pricing Comparison (March 2026)

> Load model: 10K users, 1K DAU, 3K uploads/day, 15K queries/day
> Target: 4-8 vCPU, 16-32 GB RAM, 1TB SSD, GPU optional
> File storage: 600 GB growing | DB: PostgreSQL/SQLite | Vector: self-hosted Qdrant

---

## Summary Comparison Table

| Provider | Config | Compute/mo | Storage/mo | Extras/mo | **Total/mo** | GPU option |
|----------|--------|-----------|-----------|-----------|-------------|------------|
| **Hetzner CCX33** | 8 vCPU, 32 GB, 240 GB SSD (dedicated) | €48.49 (~$53) | Vol: €35 (800GB) + Obj: €5 (600GB) | Free 20TB egress | **~$93/mo** | GEX44 €184/mo |
| **Hetzner CAX41** | 16 vCPU ARM, 32 GB, 320 GB SSD | €24.49 (~$27) | Vol: €35 (800GB) + Obj: €5 (600GB) | Free 20TB egress | **~$67/mo** | N/A (ARM) |
| **Fly.io perf-8x** | 8 dedicated vCPU, 16 GB + 16 GB extra | $257 + $80 RAM | Vol: $150 (1TB) | ~$4 egress | **~$491/mo** | Deprecated Aug 2026 |
| **Railway** | 8 vCPU, 32 GB (usage-based) | $480 | Vol: $150 (1TB) | ~$5 egress | **~$635/mo** | None |
| **Modal** | Serverless GPU/CPU | ~$34-$95 CPU | Volumes: free(?) | Per-second billing | **$34-$395/mo** | T4 $0.59/hr, A10G $1.10/hr |
| **Cloudflare (full stack)** | Workers + AI + Vectorize + D1 + R2 + KV | $5 base | R2: $9/mo | AI + Vectorize + D1 | **~$50-85/mo** | Workers AI (edge) |

---

## 1. Hetzner Cloud (EU) — BEST VALUE

### Recommended: CCX33 (Dedicated vCPU)
| Spec | Value |
|------|-------|
| vCPU | 8 (dedicated, AMD EPYC Milan) |
| RAM | 32 GB |
| SSD | 240 GB NVMe |
| Price | **€48.49/mo** (~$53) |
| Traffic | 20 TB included (EU), egress-only billing |

### Alternative: CAX41 (ARM — cheapest)
| Spec | Value |
|------|-------|
| vCPU | 16 (Ampere Altra, shared) |
| RAM | 32 GB |
| SSD | 320 GB NVMe |
| Price | **€24.49/mo** (~$27) |
| Traffic | 20 TB included (EU) |

### Storage Add-ons
| Service | Price |
|---------|-------|
| Block Storage (Volumes) | €0.044/GB/mo → 800 GB = **€35.20/mo** |
| Object Storage (S3) | €4.99/mo base (1 TB storage + 1 TB egress included) |
| Snapshots | €0.011/GB/mo |
| Extra traffic (EU) | €1.00/TB |

### GPU Option: GEX44
| Spec | Value |
|------|-------|
| GPU | NVIDIA RTX 4000 SFF Ada (20 GB GDDR6) |
| CPU | Intel i5-13500 (14 cores) |
| RAM | 64 GB |
| Storage | 2x 1.92 TB NVMe SSD |
| Price | **€184/mo** + €79 setup |

### GEX131 (high-end GPU)
| Spec | Value |
|------|-------|
| GPU | NVIDIA RTX PRO 6000 Blackwell |
| Price | **€889/mo** (no setup fee, hourly billing available) |

### Total estimate (CCX33 + 800GB volume + Object Storage):
**~€88.68/mo (~$97/mo)**

### Pros
- Unbeatable price/performance ratio in EU
- Dedicated vCPU (no noisy neighbors on CCX)
- 20 TB free egress in EU
- S3-compatible Object Storage at €4.99/mo for 1TB
- GDPR-compliant EU data centers (Germany/Finland)
- ARM servers (CAX) are 50% cheaper than x86

### Cons
- No managed Postgres (must self-host)
- No managed vector DB (must self-host Qdrant)
- US locations have only 1 TB included traffic (vs 20 TB in EU)
- April 2026 price increase: +30-37% on cloud servers (CCX33 likely ~€63-66 after)
- No serverless/auto-scaling — you manage everything
- GPU servers are dedicated (not cloud VMs) — less flexible

---

## 2. Fly.io — GOOD FOR GLOBALLY DISTRIBUTED

### Recommended: performance-8x + extra RAM
| Spec | Value |
|------|-------|
| vCPU | 8 dedicated |
| RAM | 16 GB base + 16 GB extra = 32 GB |
| Price | $257.54 base + $80 extra RAM = **$337.54/mo** |

### Alternative: performance-4x + extra RAM
| Spec | Value |
|------|-------|
| vCPU | 4 dedicated |
| RAM | 8 GB base + 24 GB extra = 32 GB |
| Price | $128.77 base + $120 extra RAM = **$248.77/mo** |

### Storage
| Service | Price |
|---------|-------|
| Persistent Volumes | $0.15/GB/mo → 1 TB = **$150/mo** |
| Volume Snapshots | $0.08/GB/mo (first 10 GB free) |

### Network
| Service | Price |
|---------|-------|
| Egress (NA/EU) | $0.02/GB |
| IPv4 address | $2/mo per app |
| Ingress | Free |

### GPU (DEPRECATED — unavailable after August 2026)
| GPU | Price/hr |
|-----|----------|
| A10 | $0.75/hr |
| L40S | $0.70/hr |
| A100 40G | $1.25/hr |
| A100 80G | $1.50/hr |

### Total estimate (perf-8x, 32GB, 1TB volume, 200GB egress):
**~$491/mo**

### Pros
- Global edge network (35+ regions)
- Per-second billing — pay only while running
- Managed Postgres available
- LiteFS for distributed SQLite
- Easy deployment from Dockerfile
- Auto-scaling with min/max instances
- 40% discount on reserved compute

### Cons
- Expensive for always-on workloads vs Hetzner (5-6x more)
- GPU machines deprecated August 2026
- No free tier for new customers
- Persistent volumes tied to single region
- $0.15/GB storage is 3.4x Hetzner's price
- Extra RAM at $5/GB/month adds up fast

---

## 3. Railway — SIMPLE BUT EXPENSIVE

### Configuration (usage-based)
| Resource | Rate | 8vCPU/32GB cost |
|----------|------|-----------------|
| CPU | $20/vCPU/mo | $160/mo |
| RAM | $10/GB/mo | $320/mo |
| Volume Storage | $0.15/GB/mo | $150/mo (1TB) |
| Egress | $0.05/GB | ~$5/mo (100GB) |

### Plans
| Plan | Base | Credits |
|------|------|---------|
| Pro | $20/mo | $20 included toward usage |

### Total estimate (8 vCPU, 32 GB RAM, 1TB storage, 100GB egress):
**~$635/mo**

### Pros
- Simplest deployment UX (GitHub push → deploy)
- Per-minute billing
- Built-in Postgres with one click
- Good CI/CD pipeline integration
- Supports monorepos well

### Cons
- Most expensive option for this workload (7x Hetzner)
- No GPU support
- No object storage (must use external S3)
- $10/GB RAM is very expensive vs $0.044/GB Hetzner volume
- No ARM instances
- Resource limits not publicly documented

---

## 4. Modal.com — SERVERLESS GPU (BEST FOR INFERENCE)

### Compute Pricing (per second, pay-per-use)
| Resource | Per second | Per hour | Per month (730h) |
|----------|-----------|----------|-----------------|
| CPU (1 physical core = 2 vCPU) | $0.0000131 | $0.047 | $34.43 |
| Memory (1 GiB) | $0.00000222 | $0.008 | $5.84 |
| T4 GPU | $0.000164 | $0.59 | $430.70 |
| L4 GPU | $0.000222 | $0.80 | $583.60 |
| A10G GPU | $0.000306 | $1.10 | $803.00 |
| L40S GPU | $0.000542 | $1.95 | $1,423.50 |
| A100 40GB | $0.000583 | $2.10 | $1,533.00 |
| A100 80GB | $0.000694 | $2.50 | $1,825.00 |
| H100 | $0.001097 | $3.95 | $2,883.10 |

### Plans
| Feature | Starter | Team |
|---------|---------|------|
| Base cost | $0 | $250/mo |
| Free credits | $30/mo | $100/mo |
| Max containers | 100 | 1,000 |
| Max concurrent GPUs | 10 | 50 |
| Seats | 3 | Unlimited |

### Storage
- Volumes: pricing not publicly documented (appears to be included/free currently)
- No persistent block storage like traditional VPS

### Cold Start
- Sub-3 seconds with memory snapshotting
- Container images cached on warm infrastructure

### Total estimate — CPU-only always-on (4 cores, 32 GB):
4 cores × $34.43 + 32 GB × $5.84 = **~$324/mo**

### Total estimate — Burst GPU (T4, 4 hrs/day for embeddings):
$0.59/hr × 4h × 30d = **~$71/mo** (GPU only)

### Pros
- True pay-per-second (idle = $0)
- Best GPU pricing for burst/inference workloads
- Sub-3s cold starts
- No infrastructure management
- Scales to thousands of containers automatically
- Wide GPU selection (T4 through H100)

### Cons
- Not suitable as always-on server (no persistent process)
- No traditional DB hosting (need external Postgres)
- No object storage (need external S3)
- Storage pricing opaque
- 10 concurrent GPU limit on free tier
- Designed for batch/inference, not for hosting an API server 24/7
- Vendor lock-in to Modal's Python SDK

---

## 5. Cloudflare (Current Stack) — EDGE-NATIVE, NO SERVER

### Calculation for 10K users load

#### Workers (API server)
| Metric | Volume | Included | Overage | Cost |
|--------|--------|----------|---------|------|
| Requests | 10M/mo | 10M | — | **$0** (included in $5 base) |
| CPU time | ~50M ms/mo | 30M ms | 20M × $0.02/M = $0.40 | **$0.40** |

#### Workers AI (LLM + embeddings)
| Metric | Volume | Cost |
|--------|--------|------|
| LLM (e.g. Llama 3.1 8B) | ~64K neurons/day = 1.92M/mo | ~1.92M neurons × $0.011/1K = **$21.12** |
| Embeddings (BGE) | ~200K neurons/day = 6M/mo | ~6M neurons × $0.011/1K = **$66.00** |
| Free allocation | 300K neurons/mo | -$3.30 |
| **Subtotal AI** | | **~$83.82** |

#### Vectorize
| Metric | Volume | Calculation | Cost |
|--------|--------|-------------|------|
| Stored dims | 307M dims | (307M - 10M) × $0.05/100M = $0.15 | $0.15 |
| Queried dims | 1.38B dims/mo | (1.38B - 50M) × $0.01/1M = $13.30 | $13.30 |
| **Subtotal Vectorize** | | | **~$13.45** |

#### D1 (database)
| Metric | Volume | Included | Cost |
|--------|--------|----------|------|
| Rows written | ~90K docs × ~10 writes = 900K/mo | 50M | **$0** (within included) |
| Rows read | ~15K queries/day × 30 × 5 rows = 2.25M/mo | 25B | **$0** (within included) |
| Storage | ~5-10 GB | 5 GB | **$0-$0.75** |

#### R2 (file storage)
| Metric | Volume | Cost |
|--------|--------|------|
| Storage | 600 GB | 600 × $0.015 = **$9.00** |
| Class A ops (uploads) | ~90K/mo | 0.09M × $4.50 = **$0.41** |
| Class B ops (reads) | ~450K/mo | 0.45M × $0.36 = **$0.16** |
| Egress | Any | **$0** (always free) |

#### KV (sessions, rate limits)
| Metric | Volume | Included | Cost |
|--------|--------|----------|------|
| Reads | ~5M/mo | 10M | **$0** |
| Writes | ~500K/mo | 1M | **$0** |
| Storage | ~100 MB | 1 GB | **$0** |

### Total Cloudflare estimate:
| Component | Cost/mo |
|-----------|---------|
| Workers base plan | $5.00 |
| Workers CPU overage | $0.40 |
| Workers AI | $83.82 |
| Vectorize | $13.45 |
| D1 | $0.75 |
| R2 | $9.57 |
| KV | $0 |
| **TOTAL** | **~$112.99/mo** |

Note: Workers AI is the dominant cost. Using external LLM APIs (Groq, NIM) instead would drop this to ~$30/mo, making CF the cheapest option alongside Hetzner.

### Pros
- Zero server management
- Global edge (300+ cities)
- Free egress on R2
- Massive free tiers on D1 and KV
- Auto-scales to zero (no idle costs)
- No cold start on Workers (V8 isolates)
- GDPR: EU-only data residency available

### Cons
- Not suitable for long-running processes (30s CPU limit per request)
- Workers AI model selection limited vs self-hosted
- Vectorize still maturing (limits on dimensions, index count)
- D1 is SQLite-based (no Postgres features: JSON ops, full-text, etc.)
- Cannot self-host Qdrant (need Vectorize or external vector DB)
- Vendor lock-in to Cloudflare ecosystem
- Complex pricing across 6+ services to track

---

## Decision Matrix

| Criteria | Hetzner | Fly.io | Railway | Modal | Cloudflare |
|----------|---------|--------|---------|-------|------------|
| **Monthly cost** | $67-97 | $491 | $635 | $34-395 | $50-113 |
| **Price/performance** | +++++ | ++ | + | +++ (burst) | ++++ |
| **GPU access** | GEX44 €184 | Deprecated | None | Excellent | Workers AI |
| **Managed DB** | None | Postgres | Postgres | None | D1 (SQLite) |
| **Object storage** | S3 @ €5/TB | None | None | None | R2 (free egress) |
| **Global edge** | EU only | 35+ regions | Limited | US mainly | 300+ cities |
| **Auto-scaling** | Manual | Yes | Yes | Yes | Yes |
| **Ops burden** | High | Medium | Low | Low | Low |
| **Vendor lock-in** | None | Low | Low | High | Medium |
| **Max flexibility** | Full root | Containers | Containers | Functions | Edge functions |

---

## Recommendations by Use Case

### "I want the cheapest production setup"
**Hetzner CAX41 (ARM)** — ~$67/mo total. Self-host everything (Postgres, Qdrant, app). Requires ops skills.

### "I want cheap + no ops"
**Cloudflare full stack** — ~$50-113/mo. Zero servers. But locked into CF ecosystem and SQLite.

### "I want the best GPU for embeddings/inference"
**Modal** — pay-per-second GPU. Use T4 at $0.59/hr or A10G at $1.10/hr. Combine with Hetzner for the API server.

### "I want global low-latency"
**Fly.io** — deploy to 35+ regions. Worth the premium if latency matters.

### "I want simplest deployment"
**Railway** — push to GitHub, done. But you'll pay 7x vs Hetzner for the privilege.

---

## Sources

- [Hetzner Cloud Pricing](https://www.hetzner.com/cloud/pricing/)
- [Hetzner Object Storage](https://www.hetzner.com/storage/object-storage)
- [Hetzner Price Adjustment April 2026](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/)
- [Hetzner GPU GEX44](https://www.hetzner.com/dedicated-rootserver/gex44/)
- [Hetzner GPU GEX131](https://www.hetzner.com/dedicated-rootserver/gex131/)
- [Hetzner VPS Calculator (CostGoat)](https://costgoat.com/pricing/hetzner)
- [Fly.io Pricing](https://fly.io/pricing/)
- [Fly.io Resource Pricing Docs](https://fly.io/docs/about/pricing/)
- [Fly.io GPU Deprecation](https://fly.io/docs/gpus/)
- [Railway Pricing](https://railway.com/pricing)
- [Railway Pricing Docs](https://docs.railway.com/pricing)
- [Modal Pricing](https://modal.com/pricing)
- [Modal GPU Pricing (CloudGPUPrices)](https://cloudgpuprices.com/vendors/modal)
- [Cloudflare Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare Workers AI Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- [Cloudflare R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare D1 Pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare Vectorize Pricing](https://developers.cloudflare.com/vectorize/platform/pricing/)
- [Cloudflare KV Pricing](https://developers.cloudflare.com/kv/platform/pricing/)
