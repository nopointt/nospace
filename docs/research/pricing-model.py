#!/usr/bin/env python3
"""
CONTEXTER — UNIT ECONOMICS & PRICING MODEL (precise calculation)
"""

# ── COST MODEL (Hetzner production stack, monthly) ──

SERVER_COST = 33.0        # Hetzner CAX41 (16 ARM vCPU, 32 GB)
LLM_API_COST = 46.0       # DeepInfra Llama 3.1 8B Turbo
WHISPER_COST = 30.0        # Groq Whisper Turbo
JINA_BASE_COST = 15.0     # Jina v4 base
TOTAL_FIXED = SERVER_COST + LLM_API_COST + WHISPER_COST + JINA_BASE_COST  # $124/mo

# Variable costs per GB stored (monthly recurring)
STORAGE_PER_GB = 0.015     # Object storage
VECTOR_PER_GB = 0.001      # Qdrant RAM amortized
DB_PER_GB = 0.001          # PostgreSQL
VARIABLE_PER_GB = STORAGE_PER_GB + VECTOR_PER_GB + DB_PER_GB  # $0.017/GB

# One-time ingestion cost per GB (amortized over 12 months)
DOCS_PER_GB = 500
PARSE_PER_DOC = 0.003
JINA_PER_DOC = 0.0002
INGEST_PER_GB = DOCS_PER_GB * (PARSE_PER_DOC + JINA_PER_DOC)
INGEST_AMORT_PER_GB = INGEST_PER_GB / 12

# Per-user query costs (monthly)
QUERIES_PER_DAU_DAY = 15
LLM_PER_QUERY = 0.0007
JINA_PER_QUERY = 0.00005
QUERY_COST_USER_MONTH = QUERIES_PER_DAU_DAY * 30 * (LLM_PER_QUERY + JINA_PER_QUERY)

# ── Platform scale for cost calculation ──
PLATFORM_USERS = 10000
PLATFORM_GB = 3000

def user_cost(user_gb):
    """Monthly cost to serve one user with user_gb of storage at platform scale"""
    storage_share = user_gb / PLATFORM_GB
    fixed_share = TOTAL_FIXED * storage_share
    variable = user_gb * (VARIABLE_PER_GB + INGEST_AMORT_PER_GB)
    query = QUERY_COST_USER_MONTH
    return fixed_share + variable + query


# ── Tier definitions ──

TIERS_ORIGINAL = [
    (0, 1, 0),
    (1, 10, 3),
    (10, 50, 2),
    (50, 100, 1),
    (100, 1000, 0.5),
    (1000, 999999, 0.25),
]

TIERS_SMOOTH = [
    (0, 1, 0),
    (1, 10, 3),
    (10, 50, 2),
    (50, 100, 1.5),
    (100, 1000, 0.75),
    (1000, 999999, 0.25),
]

def monthly_bill(user_gb, n, tiers):
    """Calculate monthly bill for user_gb storage with given n and tier structure"""
    bill = 0.0
    total_mb = user_gb * 1024
    for (min_gb, max_gb, mult) in tiers:
        min_mb = min_gb * 1024
        max_mb = max_gb * 1024
        if total_mb <= min_mb:
            break
        mb_in_tier = min(total_mb, max_mb) - min_mb
        if mb_in_tier <= 0:
            continue
        bill += mb_in_tier * mult * n
    return bill


# ══════════════════════════════════════════════════════════════
print("=" * 72)
print("CONTEXTER - UNIT ECONOMICS (precise Python calculation)")
print("=" * 72)

print(f"\n--- Fixed infrastructure: ${TOTAL_FIXED:.2f}/month ---")
print(f"  Server: ${SERVER_COST:.0f}  LLM: ${LLM_API_COST:.0f}  Whisper: ${WHISPER_COST:.0f}  Jina: ${JINA_BASE_COST:.0f}")
print(f"\n--- Variable per GB/month ---")
print(f"  Storage:      ${STORAGE_PER_GB:.4f}")
print(f"  Vector DB:    ${VECTOR_PER_GB:.4f}")
print(f"  Database:     ${DB_PER_GB:.4f}")
print(f"  Ingest amort: ${INGEST_AMORT_PER_GB:.4f} (${INGEST_PER_GB:.2f} one-time / 12mo)")
print(f"  TOTAL var:    ${VARIABLE_PER_GB + INGEST_AMORT_PER_GB:.4f}/GB/month")
print(f"\n--- Query cost: ${QUERY_COST_USER_MONTH:.2f}/user/month ---")

# ── COST PER USER ──
print(f"\n{'=' * 72}")
print(f"COST PER USER (platform: {PLATFORM_USERS:,} users, {PLATFORM_GB:,} GB)")
print(f"{'=' * 72}")
print(f"{'Storage':>10} | {'Cost/mo':>10} | {'Cost/GB':>10} | {'Cost/MB':>12}")
print(f"{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*12}")

sizes = [1, 2, 3, 5, 7, 10, 15, 25, 50, 75, 100, 200, 500, 1000, 2000, 5000]
costs = {}
for s in sizes:
    c = user_cost(s)
    costs[s] = c
    print(f"{s:>8} GB | ${c:>9.2f} | ${c/s:>9.4f} | ${c/s/1024:>11.8f}")


# ── FIND OPTIMAL n ──
print(f"\n{'=' * 72}")
print("SOLVING FOR n")
print(f"{'=' * 72}")

# n for 300% margin at 5GB user (in 3n tier)
# 5 GB = 4 GB billable at 3n = 4*1024*3*n
# 300% margin: price = 4 * cost
cost_5gb = user_cost(5)
n_300 = (4.0 * cost_5gb) / (4 * 1024 * 3)
print(f"\nn for 300% margin at 5 GB:  ${n_300:.6f}")
print(f"  5 GB bill: ${monthly_bill(5, n_300, TIERS_ORIGINAL):.2f}  cost: ${cost_5gb:.2f}")

# n for 25% margin at 1TB user
cost_1tb = user_cost(1000)

def find_n_for_margin(target_gb, target_margin, tiers):
    """Find n that gives target_margin at target_gb"""
    cost = user_cost(target_gb)
    target_bill = (1 + target_margin) * cost
    lo, hi = 0.0000001, 0.01
    for _ in range(200):
        mid = (lo + hi) / 2
        bill = monthly_bill(target_gb, mid, tiers)
        if bill < target_bill:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2

n_25 = find_n_for_margin(1000, 0.25, TIERS_ORIGINAL)
print(f"n for 25% margin at 1 TB:   ${n_25:.6f}")
print(f"  1 TB bill: ${monthly_bill(1000, n_25, TIERS_ORIGINAL):.2f}  cost: ${cost_1tb:.2f}")
print(f"\nRatio n_300/n_25: {n_300/n_25:.2f}x - these differ, both targets impossible with one n")


# ── TEST ALL VARIANTS ──
n_compromise = (n_300 + n_25) / 2
n_variants = [
    ("V1: nopoint (300% @ top)", n_300, TIERS_ORIGINAL),
    ("V2: market (25% @ bottom)", n_25, TIERS_ORIGINAL),
    ("V3: hybrid smooth", n_300, TIERS_SMOOTH),
    ("V3b: hybrid n=0.0003", 0.0003, TIERS_SMOOTH),
    ("V3c: hybrid compromise-n", n_compromise, TIERS_SMOOTH),
]

for label, n_val, tiers in n_variants:
    tier_desc = "smooth" if tiers == TIERS_SMOOTH else "original"
    print(f"\n{'=' * 72}")
    print(f"{label}  (n=${n_val:.6f}, tiers={tier_desc})")
    print(f"{'=' * 72}")
    print(f"{'Storage':>10} | {'Bill/mo':>10} | {'Cost/mo':>10} | {'Margin%':>8} | {'$/GB':>8}")
    print(f"{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*8}")

    for s in sizes:
        bill = monthly_bill(s, n_val, tiers)
        cost = user_cost(s)
        margin = ((bill - cost) / cost * 100) if cost > 0 and bill > 0 else -100
        gprice = bill / s if s > 0 else 0
        flag = " <-- LOSS" if margin < 0 else (" <-- LOW" if margin < 50 else "")
        print(f"{s:>8} GB | ${bill:>9.2f} | ${cost:>9.2f} | {margin:>7.0f}% | ${gprice:>7.4f}{flag}")


# ══════════════════════════════════════════════════════════════
# RECOMMENDED: V3 with smooth tiers, n = n_300
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print(f"RECOMMENDED MODEL: HYBRID SMOOTH (n = ${n_300:.6f})")
print(f"{'=' * 72}")

print(f"\nTier structure:")
for (min_gb, max_gb, mult) in TIERS_SMOOTH:
    if mult == 0:
        print(f"  {min_gb:>5}-{max_gb:>5} GB: FREE")
    else:
        price_gb = mult * n_300 * 1024
        print(f"  {min_gb:>5}-{max_gb:>5} GB: {mult}n/MB = ${price_gb:.2f}/GB")

print(f"\nMonthly bills:")
print(f"{'Storage':>10} | {'Bill':>10} | {'Cost':>10} | {'Margin':>8} | {'$/GB':>8} | Segment")
print(f"{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*8}-+-{'-'*20}")

segment_map = {
    1: "free", 2: "hobby", 3: "hobby", 5: "starter", 7: "starter",
    10: "small biz", 15: "small biz", 25: "growing team",
    50: "company", 75: "company", 100: "large company",
    200: "enterprise", 500: "enterprise", 1000: "heavy enterprise",
    2000: "mega", 5000: "mega"
}

for s in sizes:
    bill = monthly_bill(s, n_300, TIERS_SMOOTH)
    cost = user_cost(s)
    margin = ((bill - cost) / cost * 100) if cost > 0 and bill > 0 else -100
    gprice = bill / s if s > 0 else 0
    seg = segment_map.get(s, "")
    print(f"{s:>8} GB | ${bill:>9.2f} | ${cost:>9.2f} | {margin:>7.0f}% | ${gprice:>7.4f} | {seg}")


# ══════════════════════════════════════════════════════════════
# REVENUE PROJECTION
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print(f"REVENUE PROJECTION (10K users, recommended model)")
print(f"{'=' * 72}")

segments = [
    ("Free (<=1 GB)",      6000,  0.5),
    ("Small (2-5 GB)",     1500,  3.5),
    ("Starter (5-10 GB)",  1000,  7.5),
    ("Medium (10-50 GB)",  1000,  25),
    ("Large (50-200 GB)",   400, 100),
    ("Enterprise (200+)",   100, 500),
]

total_rev = 0
total_cos = 0
total_gb = 0
total_users = 0

print(f"\n{'Segment':<22} | {'Users':>6} | {'AvgGB':>5} | {'Bill/u':>8} | {'Rev/mo':>10} | {'Cost/mo':>10} | {'Margin':>7}")
print(f"{'-'*22}-+-{'-'*6}-+-{'-'*5}-+-{'-'*8}-+-{'-'*10}-+-{'-'*10}-+-{'-'*7}")

for name, count, avg_gb in segments:
    bill = monthly_bill(avg_gb, n_300, TIERS_SMOOTH)
    cost = user_cost(avg_gb)
    rev = bill * count
    cos = cost * count
    margin = ((bill - cost) / cost * 100) if cost > 0 and bill > 0 else 0
    total_rev += rev
    total_cos += cos
    total_gb += avg_gb * count
    total_users += count
    print(f"{name:<22} | {count:>6,} | {avg_gb:>5.0f} | ${bill:>7.2f} | ${rev:>9,.2f} | ${cos:>9,.2f} | {margin:>6.0f}%")

print(f"{'-'*22}-+-{'-'*6}-+-{'-'*5}-+-{'-'*8}-+-{'-'*10}-+-{'-'*10}-+-{'-'*7}")
gm = (total_rev - total_cos) / total_rev * 100 if total_rev > 0 else 0
print(f"{'TOTAL':<22} | {total_users:>6,} | {'':>5} | {'':>8} | ${total_rev:>9,.2f} | ${total_cos:>9,.2f} | {gm:>5.1f}%")

print(f"\n--- Summary ---")
print(f"Total stored:    {total_gb:,.0f} GB ({total_gb/1024:.1f} TB)")
print(f"MRR:             ${total_rev:,.2f}")
print(f"Total cost:      ${total_cos:,.2f}")
print(f"Gross profit:    ${total_rev - total_cos:,.2f}")
print(f"Gross margin:    {gm:.1f}%")
print(f"ARPU (paying):   ${total_rev / max(1, total_users - 6000):,.2f}")
print(f"ARPU (all):      ${total_rev / max(1, total_users):,.2f}")
print(f"ARR:             ${total_rev * 12:,.2f}")
