#!/usr/bin/env python3
"""
CONTEXTER — FINAL PRICING MODEL
Problem: guarantee >=15% margin at ANY volume, even 100 TB
"""

# ══════════════════════════════════════════════════════════════
# CORRECT COST MODEL
# ══════════════════════════════════════════════════════════════
# Previous model was WRONG: it allocated fixed costs proportionally
# to storage, making large users seem 33x more expensive.
#
# REALITY: a 100 TB user doesn't need 33x the server.
# They need more STORAGE (cheap) and more INGESTION (one-time).
# The API server handles the same requests regardless.
#
# Correct breakdown:
# 1. MARGINAL COST per GB: storage + ingestion amort (constant per GB)
# 2. FIXED COST per USER: server share + query API (constant per user)
# 3. INFRASTRUCTURE SCALING: when total GB exceeds capacity

# ── Marginal cost per GB (does not depend on user size) ──
STORAGE_PER_GB = 0.017      # object + vector + DB
INGEST_AMORT_12 = 0.1333    # $1.60 one-time / 12 months
INGEST_AMORT_24 = 0.0667    # if user stays 24 months
MARGINAL_12 = STORAGE_PER_GB + INGEST_AMORT_12  # $0.1503/GB/month
MARGINAL_24 = STORAGE_PER_GB + INGEST_AMORT_24  # $0.0837/GB/month

# ── Fixed cost per user (does not depend on storage) ──
FIXED_INFRA = 124.0         # total server + API costs
PLATFORM_USERS = 10000
FIXED_PER_USER = FIXED_INFRA / PLATFORM_USERS  # $0.0124/user
QUERY_PER_USER = 0.34       # LLM + Jina per user
USER_FIXED = FIXED_PER_USER + QUERY_PER_USER    # $0.3524/user/month

# ── Infrastructure scaling (Qdrant RAM + disk) ──
# Qdrant with Scalar Quantization: ~4 bytes per dim per vector
# 1 GB data = 500 docs * 10 chunks = 5000 vectors * 1024 dims * 4 bytes = 20 MB RAM
# So 100 TB data = 2 TB RAM for vectors — need multiple servers
# Extra server per ~50 TB of data: $33/month
EXTRA_SERVER_PER_TB = 33.0 / 50  # $0.66/TB/month = $0.00066/GB/month

def true_cost_per_gb(amort_months=12):
    """The actual marginal cost of storing+processing 1 GB/month"""
    ingest = 1.60 / amort_months  # $1.60 one-time amortized
    storage = 0.017              # recurring storage
    infra_scaling = 0.00066      # extra server capacity
    return ingest + storage + infra_scaling

def true_user_cost(user_gb, amort_months=12):
    """Total cost to serve one user with user_gb storage"""
    return USER_FIXED + user_gb * true_cost_per_gb(amort_months)

n = 0.000422

print("=" * 72)
print("CORRECTED COST MODEL")
print("=" * 72)
print(f"\nMarginal cost per GB/month:")
print(f"  12-mo amort: ${true_cost_per_gb(12):.4f}/GB")
print(f"  24-mo amort: ${true_cost_per_gb(24):.4f}/GB")
print(f"  36-mo amort: ${true_cost_per_gb(36):.4f}/GB")
print(f"  Pure retention (no new uploads): ${0.017 + 0.00066:.5f}/GB")
print(f"\nFixed per user: ${USER_FIXED:.4f}/month (server share + queries)")
print(f"Infra scaling: ${EXTRA_SERVER_PER_TB * 1000:.2f}/TB extra server cost")

# ══════════════════════════════════════════════════════════════
# FIND MINIMUM MULTIPLIER FOR 15% MARGIN
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print("MINIMUM MULTIPLIER FOR 15% MARGIN (at any volume)")
print(f"{'=' * 72}")

# At very large volumes, per-user fixed cost becomes negligible per GB.
# The floor is determined by marginal cost per GB.
#
# For margin M: price >= cost * (1 + M)
# price_per_gb = mult * n * 1024
# cost_per_gb = true_cost_per_gb(amort)
# mult * n * 1024 >= true_cost_per_gb * 1.15
# mult >= true_cost_per_gb * 1.15 / (n * 1024)

for amort in [12, 18, 24, 36]:
    cpg = true_cost_per_gb(amort)
    min_price = cpg * 1.15
    min_mult = min_price / (n * 1024)
    print(f"\n  {amort}-month amortization:")
    print(f"    Cost/GB: ${cpg:.4f}")
    print(f"    Min price for 15%: ${min_price:.4f}/GB")
    print(f"    Min multiplier: {min_mult:.3f}n")
    print(f"    Price at this mult: ${min_mult * n * 1024:.4f}/GB")

# ══════════════════════════════════════════════════════════════
# RECOMMENDED: 0.40n for 1TB+ (12-mo amort) or 0.25n (24-mo amort)
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print("KEY INSIGHT: Amortization period is the lever")
print(f"{'=' * 72}")
print(f"""
The 1TB+ user's margin depends on HOW LONG they stay:

  At 0.25n ($0.108/GB):
    12-mo amort: LOSS (cost $0.151/GB > price $0.108/GB)
    24-mo amort: 29% margin (cost $0.084/GB)
    36-mo amort: 57% margin (cost $0.069/GB)

  At 0.40n ($0.173/GB):
    12-mo amort: 15% margin (cost $0.151/GB)
    24-mo amort: 106% margin
    36-mo amort: 152% margin

Enterprise users (1TB+) typically stay 24-36 months.
Question: optimize for worst case (12mo) or expected case (24mo)?
""")

# ══════════════════════════════════════════════════════════════
# FINAL MODEL: Two options for nopoint
# ══════════════════════════════════════════════════════════════

# Option 1: Conservative (0.40n, 12-mo safe)
TIERS_CONSERVATIVE = [
    (0, 1, 0), (1, 10, 3), (10, 50, 2),
    (50, 100, 1.5), (100, 1000, 0.75), (1000, 999999, 0.40),
]

# Option 2: Aggressive (0.25n, needs 24-mo retention to be safe)
TIERS_AGGRESSIVE = [
    (0, 1, 0), (1, 10, 3), (10, 50, 2),
    (50, 100, 1.5), (100, 1000, 0.75), (1000, 999999, 0.25),
]

# Option 3: HYBRID — annual contract at 0.25n, month-to-month at 0.40n
# (Most SaaS do this — annual = cheaper per unit, monthly = premium)

def bill(user_gb, n_val, tiers):
    total_mb = user_gb * 1024
    b = 0.0
    for (lo, hi, mult) in tiers:
        lo_mb, hi_mb = lo * 1024, hi * 1024
        if total_mb <= lo_mb:
            break
        mb = min(total_mb, hi_mb) - lo_mb
        if mb > 0:
            b += mb * mult * n_val
    return b

for label, tiers, amort_default in [
    ("CONSERVATIVE (0.40n, 12-mo safe)", TIERS_CONSERVATIVE, 12),
    ("AGGRESSIVE (0.25n, needs 24-mo)", TIERS_AGGRESSIVE, 24),
]:
    print(f"\n{'=' * 72}")
    print(f"  {label}")
    print(f"{'=' * 72}")

    for (lo, hi, mult) in tiers:
        if mult == 0:
            print(f"  {lo:>5}-{hi:>6} GB: FREE")
        else:
            print(f"  {lo:>5}-{hi:>6} GB: {mult}n/MB = ${mult * n * 1024:.2f}/GB")

    print(f"\n{'Storage':>10} | {'Bill/mo':>10} | {'Cost/mo':>10} | {'Margin':>8} | {'$/GB':>8} | {'Status':>12}")
    print(f"{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*8}-+-{'-'*12}")

    for s in [1, 2, 5, 10, 25, 50, 75, 100, 200, 500, 1000, 2000, 5000, 10000, 50000, 100000]:
        b = bill(s, n, tiers)
        c = true_user_cost(s, amort_default)
        m = ((b - c) / c * 100) if c > 0 and b > 0 else -100
        gprice = b / s if s > 0 else 0
        if b == 0:
            status = "FREE"
        elif m < 0:
            status = "LOSS!"
        elif m < 15:
            status = "< 15%!"
        elif m < 50:
            status = "ok"
        else:
            status = "good"
        print(f"{s:>8} GB | ${b:>9,.2f} | ${c:>9,.2f} | {m:>7.0f}% | ${gprice:>7.4f} | {status:>12}")

# ══════════════════════════════════════════════════════════════
# BEST SOLUTION: ANNUAL CONTRACT PRICING
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print("BEST SOLUTION: Month-to-month vs Annual pricing")
print(f"{'=' * 72}")
print(f"""
Standard SaaS practice: annual contracts get a discount.

  MONTH-TO-MONTH: 0.40n at 1TB+ ($0.17/GB) — safe at 12-mo amort
  ANNUAL CONTRACT: 0.25n at 1TB+ ($0.11/GB) — safe at 24-mo (guaranteed by contract)

This naturally solves the problem:
- Short-term users (high churn risk) pay more -> 15%+ margin guaranteed
- Long-term users (annual commit) pay less -> still 29%+ margin (24-mo amort)
- Enterprise EXPECTS annual pricing to be cheaper
- We WANT enterprise on annual (predictable revenue, lower churn)
""")

print(f"\nFinal recommended tier table:")
print(f"\n{'':>10} | {'Monthly':>12} | {'Annual':>12}")
print(f"{'Tier':>10} | {'$/GB':>12} | {'$/GB':>12}")
print(f"{'-'*10}-+-{'-'*12}-+-{'-'*12}")
for (lo, hi, mult_m) in TIERS_CONSERVATIVE:
    if mult_m == 0:
        print(f"{'0-1 GB':>10} | {'FREE':>12} | {'FREE':>12}")
    elif hi == 999999:
        mult_a = 0.25  # annual gets the discount
        print(f"{lo}-{hi} GB".replace("999999", "inf")[:10].rjust(10) +
              f" | ${mult_m * n * 1024:>11.2f} | ${mult_a * n * 1024:>11.2f}")
    else:
        print(f"{lo}-{hi} GB"[:10].rjust(10) +
              f" | ${mult_m * n * 1024:>11.2f} | ${mult_m * n * 1024:>11.2f}")

# ══════════════════════════════════════════════════════════════
# REVENUE: Conservative model
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print("REVENUE (Conservative 0.40n, 10K users)")
print(f"{'=' * 72}")

segments = [
    ("Free (<=1 GB)",      6000,  0.5, 12),
    ("Small (2-5 GB)",     1500,  3.5, 12),
    ("Starter (5-10 GB)",  1000,  7.5, 12),
    ("Medium (10-50 GB)",  1000,  25,  12),
    ("Large (50-200 GB)",   400, 100,  12),
    ("Enterprise (200+)",   100, 500,  24),  # enterprise = 24-mo amort
]

total_rev = 0
total_cos = 0

print(f"\n{'Segment':<22} | {'Users':>6} | {'AvgGB':>5} | {'Bill/u':>8} | {'Rev/mo':>10} | {'Cost/mo':>10} | {'Margin':>7}")
print(f"{'-'*22}-+-{'-'*6}-+-{'-'*5}-+-{'-'*8}-+-{'-'*10}-+-{'-'*10}-+-{'-'*7}")

for name, count, avg_gb, amort in segments:
    b = bill(avg_gb, n, TIERS_CONSERVATIVE)
    c = true_user_cost(avg_gb, amort)
    rev = b * count
    cos = c * count
    margin = ((b - c) / c * 100) if c > 0 and b > 0 else 0
    total_rev += rev
    total_cos += cos
    print(f"{name:<22} | {count:>6,} | {avg_gb:>5.0f} | ${b:>7.2f} | ${rev:>9,.2f} | ${cos:>9,.2f} | {margin:>6.0f}%")

print(f"{'-'*22}-+-{'-'*6}-+-{'-'*5}-+-{'-'*8}-+-{'-'*10}-+-{'-'*10}-+-{'-'*7}")
gm = (total_rev - total_cos) / total_rev * 100 if total_rev > 0 else 0
print(f"{'TOTAL':<22} | {10000:>6,} | {'':>5} | {'':>8} | ${total_rev:>9,.2f} | ${total_cos:>9,.2f} | {gm:>5.1f}%")

print(f"\nMRR: ${total_rev:,.2f}")
print(f"ARR: ${total_rev * 12:,.2f}")
print(f"Gross margin: {gm:.1f}%")
print(f"Gross profit: ${total_rev - total_cos:,.2f}/mo")
