#!/usr/bin/env python3
"""
CONTEXTER — Smooth tiers comparison + 15% margin floor at any volume
"""

# ── COST MODEL ──
TOTAL_FIXED = 124.0  # server + APIs
STORAGE_PER_GB = 0.015
VECTOR_PER_GB = 0.001
DB_PER_GB = 0.001
VARIABLE_PER_GB = STORAGE_PER_GB + VECTOR_PER_GB + DB_PER_GB  # $0.017

DOCS_PER_GB = 500
INGEST_PER_GB = DOCS_PER_GB * (0.003 + 0.0002)  # $1.60 one-time
INGEST_AMORT_PER_GB = INGEST_PER_GB / 12  # $0.1333 monthly

QUERY_COST_USER = 0.34  # per user/month

PLATFORM_USERS = 10000
PLATFORM_GB = 3000

def user_cost(user_gb, amort_months=12):
    """Cost to serve one user. amort_months controls ingestion amortization."""
    ingest_amort = (DOCS_PER_GB * (0.003 + 0.0002)) / amort_months
    storage_share = user_gb / PLATFORM_GB
    fixed_share = TOTAL_FIXED * storage_share
    variable = user_gb * (VARIABLE_PER_GB + ingest_amort)
    return fixed_share + variable + QUERY_COST_USER

def marginal_cost_per_gb(amort_months=12):
    """Pure marginal cost of 1 additional GB (no fixed share)"""
    ingest_amort = (DOCS_PER_GB * (0.003 + 0.0002)) / amort_months
    return VARIABLE_PER_GB + ingest_amort

# ══════════════════════════════════════════════════════════════
# Q1: What do smooth tiers give?
# ══════════════════════════════════════════════════════════════
print("=" * 72)
print("Q1: SMOOTH TIERS vs ORIGINAL — what changes?")
print("=" * 72)

n = 0.000422

TIERS_ORIG = [
    (0, 1, 0), (1, 10, 3), (10, 50, 2),
    (50, 100, 1), (100, 1000, 0.5), (1000, 999999, 0.25),
]
TIERS_SMOOTH = [
    (0, 1, 0), (1, 10, 3), (10, 50, 2),
    (50, 100, 1.5), (100, 1000, 0.75), (1000, 999999, 0.25),
]

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

print(f"\nn = ${n:.6f}")
print(f"\n{'Storage':>10} | {'Orig bill':>10} | {'Smooth bill':>11} | {'Delta':>8} | {'Orig %':>8} | {'Smooth %':>9}")
print(f"{'-'*10}-+-{'-'*10}-+-{'-'*11}-+-{'-'*8}-+-{'-'*8}-+-{'-'*9}")

for s in [1, 5, 10, 25, 50, 75, 100, 200, 500, 1000, 2000, 5000]:
    b_o = bill(s, n, TIERS_ORIG)
    b_s = bill(s, n, TIERS_SMOOTH)
    c = user_cost(s)
    m_o = ((b_o - c) / c * 100) if c > 0 and b_o > 0 else -100
    m_s = ((b_s - c) / c * 100) if c > 0 and b_s > 0 else -100
    delta = b_s - b_o
    print(f"{s:>8} GB | ${b_o:>9.2f} | ${b_s:>10.2f} | {'+' if delta >= 0 else ''}{delta:>7.2f} | {m_o:>7.0f}% | {m_s:>8.0f}%")

print(f"\nSmooth tiers fix the 50-500 GB margin dip.")
print(f"BUT: at 2 TB+ both models go into LOSS territory because 0.25n < cost/MB.")


# ══════════════════════════════════════════════════════════════
# Q2: Never below 15% margin — find the minimum multiplier
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print("Q2: MINIMUM 15% MARGIN AT ANY VOLUME — finding the floor")
print(f"{'=' * 72}")

# The problem: cost per GB has a FLOOR at ~$0.15-0.19/GB
# This floor is dominated by ingestion amortization ($0.1333/GB/month)
# At 0.25n price = $0.11/GB — BELOW cost floor!

mc_12 = marginal_cost_per_gb(12)
mc_24 = marginal_cost_per_gb(24)
mc_36 = marginal_cost_per_gb(36)

print(f"\nMarginal cost per GB/month (no fixed share, pure variable):")
print(f"  12-month amort: ${mc_12:.4f}/GB = ${mc_12/1024:.8f}/MB")
print(f"  24-month amort: ${mc_24:.4f}/GB = ${mc_24/1024:.8f}/MB")
print(f"  36-month amort: ${mc_36:.4f}/GB = ${mc_36/1024:.8f}/MB")
print(f"  No ingestion (retention only): ${VARIABLE_PER_GB:.4f}/GB")

# For 15% margin: price >= cost * 1.15
# With 12-month amortization:
min_price_12 = mc_12 * 1.15
min_price_24 = mc_24 * 1.15
min_price_36 = mc_36 * 1.15

# What multiplier of n gives this price?
# mult * n * 1024 = min_price_per_gb
# mult = min_price_per_gb / (n * 1024)
min_mult_12 = min_price_12 / (n * 1024)
min_mult_24 = min_price_24 / (n * 1024)
min_mult_36 = min_price_36 / (n * 1024)

print(f"\nFor 15% minimum margin:")
print(f"  12-mo amort: min price ${min_price_12:.4f}/GB -> multiplier >= {min_mult_12:.2f}n")
print(f"  24-mo amort: min price ${min_price_24:.4f}/GB -> multiplier >= {min_mult_24:.2f}n")
print(f"  36-mo amort: min price ${min_price_36:.4f}/GB -> multiplier >= {min_mult_36:.2f}n")

print(f"\n  Current 1TB+ tier: 0.25n = ${0.25 * n * 1024:.4f}/GB")
print(f"  RESULT: 0.25n gives BELOW-COST pricing with 12-month amort!")

# ══════════════════════════════════════════════════════════════
# SOLUTION: Dynamic floor approach
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print("SOLUTIONS")
print(f"{'=' * 72}")

# Solution A: Raise 1TB+ multiplier to 0.4n
print(f"\n--- Solution A: Raise 1TB+ multiplier to 0.40n ---")
TIERS_A = [
    (0, 1, 0), (1, 10, 3), (10, 50, 2),
    (50, 100, 1.5), (100, 1000, 0.75), (1000, 999999, 0.40),
]

for s in [1000, 2000, 5000, 10000, 50000, 100000]:
    b = bill(s, n, TIERS_A)
    c = user_cost(s)
    m = ((b - c) / c * 100) if c > 0 and b > 0 else -100
    print(f"  {s:>7,} GB: ${b:>10,.2f} bill, ${c:>10,.2f} cost, {m:>6.0f}% margin")

# Solution B: Keep 0.25n but add absolute floor price per MB
print(f"\n--- Solution B: 0.25n with floor at ${min_price_12/1024:.6f}/MB ---")
floor_per_mb = min_price_12 / 1024

def bill_with_floor(user_gb, n_val, tiers, floor_mb):
    total_mb = user_gb * 1024
    b = 0.0
    for (lo, hi, mult) in tiers:
        lo_mb, hi_mb = lo * 1024, hi * 1024
        if total_mb <= lo_mb:
            break
        mb = min(total_mb, hi_mb) - lo_mb
        if mb > 0:
            effective_price = max(mult * n_val, floor_mb)
            b += mb * effective_price
    return b

for s in [1000, 2000, 5000, 10000, 50000, 100000]:
    b = bill_with_floor(s, n, TIERS_SMOOTH, floor_per_mb)
    c = user_cost(s)
    m = ((b - c) / c * 100) if c > 0 and b > 0 else -100
    print(f"  {s:>7,} GB: ${b:>10,.2f} bill, ${c:>10,.2f} cost, {m:>6.0f}% margin")

# Solution C: Replace 0.25n with 0.40n (simpler)
print(f"\n--- Solution C: Replace all tiers below floor with 0.40n ---")
TIERS_C = [
    (0, 1, 0), (1, 10, 3), (10, 50, 2),
    (50, 100, 1.5), (100, 1000, 0.75), (1000, 999999, 0.40),
]

print(f"\nFinal tier structure:")
for (lo, hi, mult) in TIERS_C:
    if mult == 0:
        print(f"  {lo:>5}-{hi:>6} GB: FREE")
    else:
        pgb = mult * n * 1024
        print(f"  {lo:>5}-{hi:>6} GB: {mult}n/MB = ${pgb:.2f}/GB")

print(f"\nFull margin table:")
print(f"{'Storage':>10} | {'Bill/mo':>10} | {'Cost/mo':>10} | {'Margin':>8} | {'$/GB':>8}")
print(f"{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*8}")

all_sizes = [1, 2, 5, 10, 25, 50, 75, 100, 200, 500, 1000, 2000, 5000, 10000, 50000, 100000]
for s in all_sizes:
    b = bill(s, n, TIERS_C)
    c = user_cost(s)
    m = ((b - c) / c * 100) if c > 0 and b > 0 else -100
    gprice = b / s if s > 0 else 0
    flag = " *** BELOW 15%" if m < 15 and m > -100 else ""
    print(f"{s:>8} GB | ${b:>9,.2f} | ${c:>9,.2f} | {m:>7.0f}% | ${gprice:>7.4f}{flag}")

# Check: what is the absolute minimum margin at any volume?
min_margin = 999
min_margin_gb = 0
for s in range(1, 200001, 100):
    b = bill(s, n, TIERS_C)
    c = user_cost(s)
    if b > 0 and c > 0:
        m = (b - c) / c * 100
        if m < min_margin:
            min_margin = m
            min_margin_gb = s

print(f"\nAbsolute minimum margin: {min_margin:.1f}% at {min_margin_gb:,} GB")

# ══════════════════════════════════════════════════════════════
# Revenue comparison
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 72}")
print("REVENUE IMPACT: 0.25n vs 0.40n at 1TB+ tier")
print(f"{'=' * 72}")

segments = [
    ("Free (<=1 GB)",      6000,  0.5),
    ("Small (2-5 GB)",     1500,  3.5),
    ("Starter (5-10 GB)",  1000,  7.5),
    ("Medium (10-50 GB)",  1000,  25),
    ("Large (50-200 GB)",   400, 100),
    ("Enterprise (200+)",   100, 500),
]

for label, tiers in [("0.25n (old)", TIERS_SMOOTH), ("0.40n (new)", TIERS_C)]:
    total_rev = 0
    total_cos = 0
    for name, count, avg_gb in segments:
        b = bill(avg_gb, n, tiers)
        c = user_cost(avg_gb)
        total_rev += b * count
        total_cos += c * count
    gm = (total_rev - total_cos) / total_rev * 100
    print(f"\n  {label}:")
    print(f"    MRR: ${total_rev:,.2f}")
    print(f"    Cost: ${total_cos:,.2f}")
    print(f"    Gross profit: ${total_rev - total_cos:,.2f}")
    print(f"    Gross margin: {gm:.1f}%")
    print(f"    ARR: ${total_rev * 12:,.2f}")
