#!/usr/bin/env python3
"""Annual discounts per tier, maintaining >=15% margin at 24-mo amort"""

n = 0.000422

# Costs
MARGINAL_12 = 0.1510  # $/GB/month (12-mo amort)
MARGINAL_24 = 0.0843  # $/GB/month (24-mo amort)
USER_FIXED = 0.3524   # $/user/month

# Tiers (monthly)
TIERS = [
    ("0-1 GB",       0,    0,    1,    0),     # free
    ("1-10 GB",      3,    1,   10,    3),
    ("10-50 GB",     2,   10,   50,    2),
    ("50-100 GB",    1.5, 50,  100,   1.5),
    ("100-1000 GB",  0.75,100, 1000,  0.75),
    ("1000+ GB",     0.40,1000,999999,0.40),
]

print("=" * 80)
print("ANNUAL DISCOUNT PER TIER")
print("=" * 80)

# For each tier: find max discount that keeps margin >= 15%
# Annual = 24-mo amort (user commits for 12 months)
# margin = (price - cost) / cost >= 0.15
# price >= cost * 1.15
# min_annual_price = MARGINAL_24 * 1.15

min_annual_per_gb = MARGINAL_24 * 1.15  # $0.0970/GB

print(f"\nMonthly cost/GB (12-mo amort): ${MARGINAL_12:.4f}")
print(f"Annual cost/GB (24-mo amort):  ${MARGINAL_24:.4f}")
print(f"Min annual price for 15% margin: ${min_annual_per_gb:.4f}/GB")

print(f"\n{'Tier':<15} | {'Mo $/GB':>8} | {'Min Ann':>8} | {'Max disc':>8} | {'Rec disc':>8} | {'Ann $/GB':>8} | {'Ann margin':>10}")
print(f"{'-'*15}-+-{'-'*8}-+-{'-'*8}-+-{'-'*8}-+-{'-'*8}-+-{'-'*8}-+-{'-'*10}")

annual_mults = {}
for label, mult, lo, hi, _ in TIERS:
    if mult == 0:
        print(f"{label:<15} | {'FREE':>8} | {'-':>8} | {'-':>8} | {'-':>8} | {'FREE':>8} | {'-':>10}")
        continue

    monthly_per_gb = mult * n * 1024

    # Max possible discount: annual price = min_annual_per_gb
    max_discount = 1 - (min_annual_per_gb / monthly_per_gb)
    max_discount = max(0, min(max_discount, 0.90))  # cap at 90%

    # Recommended discount: round to nice numbers, scale with tier
    # Higher tier (lower mult) = bigger discount (they're paying less, more price-sensitive)
    if mult >= 3:
        rec_discount = 0.10  # 10% - small users, already cheap
    elif mult >= 2:
        rec_discount = 0.15  # 15%
    elif mult >= 1.5:
        rec_discount = 0.20  # 20%
    elif mult >= 0.75:
        rec_discount = 0.25  # 25%
    else:
        rec_discount = 0.35  # 35% - enterprise, big commitment

    # But cap at max_discount
    rec_discount = min(rec_discount, max_discount)

    annual_per_gb = monthly_per_gb * (1 - rec_discount)
    annual_margin = (annual_per_gb - MARGINAL_24) / MARGINAL_24 * 100

    annual_mult = annual_per_gb / (n * 1024)
    annual_mults[label] = (annual_mult, rec_discount, annual_per_gb, annual_margin)

    print(f"{label:<15} | ${monthly_per_gb:>7.2f} | ${min_annual_per_gb:>7.4f} | {max_discount:>7.0%} | {rec_discount:>7.0%} | ${annual_per_gb:>7.2f} | {annual_margin:>9.0f}%")

# ══════════════════════════════════════════════════════════════
# Full bill comparison
# ══════════════════════════════════════════════════════════════

TIERS_MONTHLY = [
    (0, 1, 0), (1, 10, 3), (10, 50, 2),
    (50, 100, 1.5), (100, 1000, 0.75), (1000, 999999, 0.40),
]

# Build annual tiers from recommended discounts
TIERS_ANNUAL = [
    (0, 1, 0),
    (1, 10, 3 * 0.90),       # 10% off
    (10, 50, 2 * 0.85),      # 15% off
    (50, 100, 1.5 * 0.80),   # 20% off
    (100, 1000, 0.75 * 0.75),# 25% off
    (1000, 999999, 0.40 * 0.65), # 35% off
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

def user_cost(user_gb, amort):
    ingest = 1.60 / amort
    return USER_FIXED + user_gb * (0.017 + ingest + 0.00066)

print(f"\n{'=' * 80}")
print("MONTHLY vs ANNUAL BILLS")
print(f"{'=' * 80}")
print(f"\n{'Storage':>10} | {'Monthly':>10} | {'Annual':>10} | {'Savings':>8} | {'Disc%':>6} | {'Ann cost':>9} | {'Ann margin':>10}")
print(f"{'-'*10}-+-{'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*6}-+-{'-'*9}-+-{'-'*10}")

sizes = [1, 2, 5, 10, 25, 50, 75, 100, 200, 500, 1000, 2000, 5000, 10000, 100000]
for s in sizes:
    bm = bill(s, n, TIERS_MONTHLY)
    ba = bill(s, n, TIERS_ANNUAL)
    ca = user_cost(s, 24)
    saving = bm - ba
    disc = (saving / bm * 100) if bm > 0 else 0
    margin = ((ba - ca) / ca * 100) if ca > 0 and ba > 0 else -100
    flag = " ***" if margin < 15 and ba > 0 else ""
    print(f"{s:>8} GB | ${bm:>9,.2f} | ${ba:>9,.2f} | ${saving:>7,.2f} | {disc:>5.0f}% | ${ca:>8,.2f} | {margin:>9.0f}%{flag}")

# ══════════════════════════════════════════════════════════════
# Clean pricing table for landing page
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 80}")
print("PRICING TABLE (for landing page)")
print(f"{'=' * 80}")

tier_data = [
    ("0-1 GB",      0,    0,    "-",  "-"),
    ("1-10 GB",     3,    3*0.90, "10%", "$1.17"),
    ("10-50 GB",    2,    2*0.85, "15%", "$0.73"),
    ("50-100 GB",   1.5,  1.5*0.80, "20%", "$0.52"),
    ("100 GB-1 TB", 0.75, 0.75*0.75, "25%", "$0.24"),
    ("1 TB+",       0.40, 0.40*0.65, "35%", "$0.11"),
]

print(f"\n{'Tier':<15} | {'Monthly':>10} | {'Annual':>10} | {'Discount':>8} | {'mult (ann)':>10}")
print(f"{'-'*15}-+-{'-'*10}-+-{'-'*10}-+-{'-'*8}-+-{'-'*10}")
for label, m_mult, a_mult, disc, _ in tier_data:
    if m_mult == 0:
        print(f"{label:<15} | {'FREE':>10} | {'FREE':>10} | {'-':>8} | {'-':>10}")
    else:
        m_price = f"${m_mult * n * 1024:.2f}/GB"
        a_price = f"${a_mult * n * 1024:.2f}/GB"
        a_m = f"{a_mult:.3f}n"
        print(f"{label:<15} | {m_price:>10} | {a_price:>10} | {disc:>8} | {a_m:>10}")

# ══════════════════════════════════════════════════════════════
# "2 months free" equivalent
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 80}")
print("ANNUAL SAVINGS MESSAGING")
print(f"{'=' * 80}")

for s in [5, 10, 50, 100, 500, 1000]:
    bm = bill(s, n, TIERS_MONTHLY)
    ba = bill(s, n, TIERS_ANNUAL)
    yearly_m = bm * 12
    yearly_a = ba * 12
    saved = yearly_m - yearly_a
    months_free = saved / bm if bm > 0 else 0
    print(f"  {s:>6} GB: monthly ${bm:.2f} x12 = ${yearly_m:,.2f}/yr | annual ${ba:.2f} x12 = ${yearly_a:,.2f}/yr | save ${saved:,.2f} ({months_free:.1f} months free)")

# ══════════════════════════════════════════════════════════════
# Revenue with mixed monthly/annual
# ══════════════════════════════════════════════════════════════
print(f"\n{'=' * 80}")
print("REVENUE (10K users, 30% annual adoption)")
print(f"{'=' * 80}")

segments = [
    ("Free (<=1 GB)",      6000,  0.5, 0.00),  # 0% annual
    ("Small (2-5 GB)",     1500,  3.5, 0.10),  # 10% annual
    ("Starter (5-10 GB)",  1000,  7.5, 0.20),  # 20% annual
    ("Medium (10-50 GB)",  1000,  25,  0.30),  # 30% annual
    ("Large (50-200 GB)",   400, 100,  0.50),  # 50% annual
    ("Enterprise (200+)",   100, 500,  0.80),  # 80% annual
]

total_rev = 0
total_cos = 0

print(f"\n{'Segment':<22} | {'Users':>6} | {'Ann%':>4} | {'Rev/mo':>10} | {'Cost/mo':>10} | {'Margin':>7}")
print(f"{'-'*22}-+-{'-'*6}-+-{'-'*4}-+-{'-'*10}-+-{'-'*10}-+-{'-'*7}")

for name, count, avg_gb, ann_pct in segments:
    monthly_users = int(count * (1 - ann_pct))
    annual_users = int(count * ann_pct)

    bm = bill(avg_gb, n, TIERS_MONTHLY)
    ba = bill(avg_gb, n, TIERS_ANNUAL)
    cm = user_cost(avg_gb, 12)
    ca = user_cost(avg_gb, 24)

    rev = bm * monthly_users + ba * annual_users
    cos = cm * monthly_users + ca * annual_users
    margin = ((rev - cos) / rev * 100) if rev > 0 else 0

    total_rev += rev
    total_cos += cos
    print(f"{name:<22} | {count:>6,} | {ann_pct:>3.0%} | ${rev:>9,.2f} | ${cos:>9,.2f} | {margin:>6.0f}%")

print(f"{'-'*22}-+-{'-'*6}-+-{'-'*4}-+-{'-'*10}-+-{'-'*10}-+-{'-'*7}")
gm = (total_rev - total_cos) / total_rev * 100 if total_rev > 0 else 0
print(f"{'TOTAL':<22} | {10000:>6,} | {'':>4} | ${total_rev:>9,.2f} | ${total_cos:>9,.2f} | {gm:>5.1f}%")

print(f"\nMRR: ${total_rev:,.2f}")
print(f"ARR: ${total_rev * 12:,.2f}")
print(f"Gross margin: {gm:.1f}%")
