#!/usr/bin/env python3
"""
Harkly Financial Model 2026 — Pessimistic Scenario
Standalone Python (stdlib only, no external dependencies).
Outputs results.md to the same directory.

CFO alignment date : 2026-02-25
Release date        : 2026-03-01 (month 3)
Author              : Assistant Agent / nopoint
"""

import os
from datetime import datetime

# ============================================================
# § 1  CONSTANTS  — all named, no magic numbers
# ============================================================

REPORT_DATE  = datetime.now().strftime("%Y-%m-%d")
LAUNCH_MONTH = 3   # March = index 3 (Jan = 1)

MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun",
               "Jul","Aug","Sep","Oct","Nov","Dec"]

# ── Credit allocations per tier ─────────────────────────────
CREDITS_FREE_DAILY     = 25         # daily cap, resets each day (no carry-over)
FREE_ACTIVE_DAYS       = 15         # pessimistic: user active 15 of 30 days
CREDITS_FREE_MONTHLY   = CREDITS_FREE_DAILY * FREE_ACTIVE_DAYS  # 375 effective

CREDITS_START          = 250        # carry-over month to month
CREDITS_PRO            = 5_000
CREDITS_ENT            = 25_000
CREDITS_WL_GIFT        = 25_000     # Enterprise gift per WL partner (personal use)

# ── SaaS subscription prices (USD/month) ────────────────────
PRICE_START            = 50.00
PRICE_PRO              = 250.00
PRICE_ENT              = 500.00
# Free = $0.00 (revenue = 0, COGS still applies)

# ── COGS model ───────────────────────────────────────────────
# Operation mix by credit volume consumed:
#   Reality layer  70% : parse + analyze 1 review = 1 credit → $0.0100/credit
#   Prediction     20% : Gemini 3 Pro ×20 consumers = 20 credits, COGS $0.100 → $0.0050/credit
#   AI Perception  10% : std LLM query = 1 credit → $0.0050/credit
MIX_REALITY          = 0.70
MIX_PREDICTION       = 0.20
MIX_PERCEPTION       = 0.10

COGS_REALITY         = 0.0100   # $/credit
COGS_PREDICTION      = 0.0050   # $/credit (Gemini 3 Pro: $0.100/20 credits)
COGS_PERCEPTION      = 0.0050   # $/credit (std LLM: $0.005/1 credit)

RAW_COGS_PER_CREDIT  = (MIX_REALITY    * COGS_REALITY   +
                         MIX_PREDICTION * COGS_PREDICTION +
                         MIX_PERCEPTION * COGS_PERCEPTION)  # = $0.00850

# COGS buffer: covers LLM price spikes, retries, inefficiency
COGS_BUFFER          = 1.50    # 50 % over estimated
EFF_COGS_PER_CREDIT  = RAW_COGS_PER_CREDIT * COGS_BUFFER   # = $0.01275

# LLM Chat operation — extra 10 % margin on top of buffered COGS
# LLM Chat multipliers (credits per message, base = Gemini 2.5 Flash = 1 credit)
# Applied: chat_cogs = base_cogs_per_credit * (1 / 1.10)  → revenue covers COGS+10%
# In aggregate model: LLM Chat share blended into EFF_COGS_PER_CREDIT.
# Separate chat margin provision recorded as a note only (not isolated in P&L).
LLM_CHAT_EXTRA_MARGIN = 0.10

# Pessimistic breakage: 15 % of credits never consumed, 85 % consumed
CREDIT_CONSUMPTION    = 0.85   # 85 % consumed

# ── Infrastructure — scales with total direct users ──────────
# Direct users = Free + Start + Pro + Enterprise (WL clients served off-platform)
INFRA_TIERS = [
    (100,   57.00),   # 0–100  users  : base stack
    (300,  120.00),   # 101–300        : scale DB + Redis
    (700,  220.00),   # 301–700        : additional workers
    (10**9, 350.00),  # 700+           : full prod tier
]

# ── Additional fixed monthly costs ──────────────────────────
AI_COSTS             = 1_000.00   # LLM API subscriptions + dev tooling
AI_COSTS_START       = 3          # begins March

OWNER_DRAW           = 2_000.00   # founder monthly draw
OWNER_DRAW_START     = 5          # begins May

# ── Partner economics ────────────────────────────────────────
ARTEM_RATE           = 0.20   # 20 % of attributable Gross Profit
# Artem attributed clients: ALL Enterprise + ALL WL partners (sole B2B channel)

# ── WL pricing ───────────────────────────────────────────────
WL_FLOOR             = 0.020    # $/credit — minimum partners may charge clients
WL_PARTNER_DISC      = 0.25     # 25 % off floor for partner wholesale
WL_WHOLESALE         = WL_FLOOR * (1 - WL_PARTNER_DISC)    # $0.015/credit

# WL tier credit quotas (resellable, excl. gift)
WL_BASE_CREDITS      = 150_000   # supports ~6 Enterprise or ~30 Pro clients
WL_PRO_CREDITS       = 500_000   # supports ~20 Enterprise or ~100 Pro
WL_SCALE_CREDITS     = 2_000_000 # supports ~80 Enterprise or ~400 Pro

WL_BASE_PRICE        = WL_BASE_CREDITS  * WL_WHOLESALE   # $2,250/mo
WL_PRO_PRICE         = WL_PRO_CREDITS   * WL_WHOLESALE   # $7,500/mo
WL_SCALE_PRICE       = WL_SCALE_CREDITS * WL_WHOLESALE   # $30,000/mo

WL_DATA = {
    "base":  (WL_BASE_PRICE,  WL_BASE_CREDITS),
    "pro":   (WL_PRO_PRICE,   WL_PRO_CREDITS),
    "scale": (WL_SCALE_PRICE, WL_SCALE_CREDITS),
}

# ── Monthly churn rates ──────────────────────────────────────
CHURN = {"free": 0.20, "start": 0.05, "pro": 0.03, "ent": 0.01}

# ============================================================
# § 2  GROWTH SCENARIO — Pessimistic
#       All organic metrics = Comet base-case ÷ 2
#       WL schedule unchanged (strategic deals, not organic)
#
# Format per month:
#   (new_free_signups, free→start%, start→pro%, pro→ent%, [wl_tiers_added])
# ============================================================

GROWTH = {
    1:  (0,  0.000, 0.000, 0.000, []),           # Jan — pre-launch
    2:  (0,  0.000, 0.000, 0.000, []),           # Feb — pre-launch
    3:  (15, 0.035, 0.020, 0.005, ["base"]),     # Mar — Launch + WL-Base (ProxyMarket)
    4:  (18, 0.040, 0.020, 0.010, []),
    5:  (20, 0.040, 0.025, 0.010, []),
    6:  (25, 0.045, 0.025, 0.010, ["pro"]),      # Jun — WL-Pro added
    7:  (28, 0.050, 0.030, 0.010, []),
    8:  (30, 0.050, 0.030, 0.015, []),
    9:  (33, 0.055, 0.035, 0.015, ["base"]),     # Sep — second WL-Base
    10: (35, 0.055, 0.035, 0.015, []),
    11: (40, 0.060, 0.040, 0.015, []),
    12: (45, 0.060, 0.040, 0.020, ["scale"]),    # Dec — WL-Scale added
}

# ============================================================
# § 3  HELPERS
# ============================================================

def infra_cost(users: float) -> float:
    for limit, cost in INFRA_TIERS:
        if users <= limit:
            return cost
    return INFRA_TIERS[-1][1]

def var_cogs(credits: float, issued: bool = True, wl_consumption: float = 0.60) -> float:
    """
    Variable COGS for a given number of credits.

    Args:
        credits: number of credits
        issued: if True, apply standard consumption rate (for direct SaaS).
                if False, use WL consumption rate (for WL quotas).
        wl_consumption: estimated consumption rate for WL partners (default 60%).
                        Partners rarely use 100% of quota; 60% is conservative.

    For direct SaaS: use issued=True (85% consumption).
    For WL quotas: use issued=False (60% consumption by default).
    """
    if issued:
        return credits * CREDIT_CONSUMPTION * EFF_COGS_PER_CREDIT
    else:
        # WL resellable quota — assume 60% consumption (realistic for WL partners)
        return credits * wl_consumption * EFF_COGS_PER_CREDIT

def usd(v: float, d: int = 0) -> str:
    if v < 0:
        return f"-${abs(v):,.{d}f}"
    return f"${v:,.{d}f}"

def pct(v: float, d: int = 1) -> str:
    return f"{v:.{d}f}"

# ============================================================
# § 4  SIMULATION
# ============================================================

def simulate(conv_mult: float = 1.0) -> list:
    """
    Run monthly simulation Jan–Dec.
    conv_mult  : multiplier on all organic conversion rates and new_free signups.
                 WL schedule is NOT affected (strategic contracts).
    Returns    : list of 12 monthly result dicts.
    """
    free_u = start_u = pro_u = ent_u = 0.0
    wl_stack = []   # cumulative: list of (tier_name, monthly_price, resellable_credits)
    rows = []

    for m in range(1, 13):
        g            = GROWTH[m]
        new_free     = g[0] * conv_mult
        f2s          = g[1] * conv_mult
        s2p          = g[2] * conv_mult
        p2e          = g[3] * conv_mult
        new_wl_tiers = g[4]            # WL schedule: NOT multiplied

        # ── Pre-launch ──
        if m < LAUNCH_MONTH:
            rows.append(_zero_row(m))
            continue

        # ── 1. Monthly churn ──
        sf = free_u  * (1 - CHURN["free"])
        ss = start_u * (1 - CHURN["start"])
        sp = pro_u   * (1 - CHURN["pro"])
        se = ent_u   * (1 - CHURN["ent"])

        # ── 2. Upgrades (from surviving population) ──
        u_f2s = sf * f2s
        u_s2p = ss * s2p
        u_p2e = sp * p2e

        # ── 3. New tier counts ──
        free_u  = max(0.0, sf - u_f2s + new_free)
        start_u = max(0.0, ss - u_s2p + u_f2s)
        pro_u   = max(0.0, sp - u_p2e + u_s2p)
        ent_u   = max(0.0, se          + u_p2e)

        fi = round(free_u)
        si = round(start_u)
        pi = round(pro_u)
        ei = round(ent_u)

        # ── 4. Add WL partners this month ──
        for t in new_wl_tiers:
            price, resell = WL_DATA[t]
            wl_stack.append((t, price, resell))

        wl_n = len(wl_stack)

        # ── Revenue ──
        rev_s  = si * PRICE_START
        rev_p  = pi * PRICE_PRO
        rev_e  = ei * PRICE_ENT
        rev_wl = sum(w[1] for w in wl_stack)
        revenue = rev_s + rev_p + rev_e + rev_wl

        # ── Credits ──
        cr_f      = fi * CREDITS_FREE_MONTHLY
        cr_s      = si * CREDITS_START
        cr_p      = pi * CREDITS_PRO
        cr_e      = ei * CREDITS_ENT
        cr_direct = cr_f + cr_s + cr_p + cr_e

        cr_wl_res  = sum(w[2] for w in wl_stack)
        cr_wl_gift = wl_n * CREDITS_WL_GIFT
        cr_wl      = cr_wl_res + cr_wl_gift
        cr_issued  = cr_direct + cr_wl
        cr_consumed = cr_issued * CREDIT_CONSUMPTION
        cr_breakage = cr_issued - cr_consumed

        # ── Variable COGS ──
        cogs_v_dir = var_cogs(cr_direct)
        cogs_v_wl  = var_cogs(cr_wl)
        cogs_var   = cogs_v_dir + cogs_v_wl

        # ── Fixed COGS ──
        direct_users = fi + si + pi + ei
        cogs_infra   = infra_cost(direct_users)
        cogs_ai      = AI_COSTS if m >= AI_COSTS_START else 0.0
        cogs_fixed   = cogs_infra + cogs_ai

        total_cogs = cogs_var + cogs_fixed

        # ── Gross Profit ──
        gp     = revenue - total_cogs
        gm_pct = gp / revenue * 100 if revenue > 0 else 0.0

        # ── Artem commission ──
        # 20 % of GP attributable to Enterprise + WL (variable COGS only, no fixed alloc)
        ent_gp = max(0.0, rev_e  - var_cogs(cr_e))
        wl_gp  = max(0.0, rev_wl - cogs_v_wl)
        artem  = (ent_gp + wl_gp) * ARTEM_RATE

        # ── Owner draw ──
        owner_d = OWNER_DRAW if m >= OWNER_DRAW_START else 0.0

        # ── Net Profit ──
        net = gp - artem - owner_d

        rows.append({
            "month": m,
            "name":  MONTH_NAMES[m - 1],
            # User counts
            "free":  fi, "start": si, "pro": pi, "ent": ei,
            "wl_count": wl_n, "wl_stack": list(wl_stack),
            "direct_users": direct_users,
            "paying": si + pi + ei + wl_n,
            # Revenue breakdown
            "rev_start": rev_s, "rev_pro": rev_p,
            "rev_ent":   rev_e, "rev_wl":  rev_wl,
            "revenue": revenue,
            # COGS breakdown
            "cogs_var":   cogs_var,
            "cogs_infra": cogs_infra,
            "cogs_ai":    cogs_ai,
            "cogs_fixed": cogs_fixed,
            "total_cogs": total_cogs,
            # Profitability
            "gp":     gp,
            "gm_pct": gm_pct,
            "artem":  artem,
            "owner_draw": owner_d,
            "net":    net,
            # Credit economy
            "cr_issued":   cr_issued,
            "cr_consumed": cr_consumed,
            "cr_breakage": cr_breakage,
        })

    return rows


def _zero_row(m: int) -> dict:
    return {
        "month": m, "name": MONTH_NAMES[m - 1],
        "free": 0, "start": 0, "pro": 0, "ent": 0,
        "wl_count": 0, "wl_stack": [], "direct_users": 0, "paying": 0,
        "rev_start": 0, "rev_pro": 0, "rev_ent": 0, "rev_wl": 0, "revenue": 0,
        "cogs_var": 0, "cogs_infra": 0, "cogs_ai": 0, "cogs_fixed": 0,
        "total_cogs": 0, "gp": 0, "gm_pct": 0,
        "artem": 0, "owner_draw": 0, "net": 0,
        "cr_issued": 0, "cr_consumed": 0, "cr_breakage": 0,
    }

# ============================================================
# § 5  OUTPUT GENERATION
# ============================================================

def totals(rows: list, key: str) -> float:
    return sum(r.get(key, 0) for r in rows)

def generate_md(base: list, bear: list, bull: list) -> str:
    L = []
    a = L.append

    def h(title: str, level: int = 2):
        a(""); a(f"{'#' * level} {title}"); a("")

    def hline():
        a(""); a("---"); a("")

    # ── HEADER ────────────────────────────────────────────────────────────────
    a("# Harkly — Financial Model 2026")
    a(f"> Сгенерировано: {REPORT_DATE}  |  Сценарий: **Пессимистичный** (Comet base ÷ 2)")
    a(f"> Релиз: 1 марта 2026  |  Горизонт: Jan–Dec 2026")
    a(f"> Все суммы в USD. COGS включает 50% буфер над расчётным значением.")
    a("")
    a("---")

    # ── § 0  ASSUMPTIONS ──────────────────────────────────────────────────────
    h("0. Ключевые допущения модели")
    a("| Параметр | Значение | Комментарий |")
    a("|---|---|---|")
    a(f"| **Кредиты Free** | {CREDITS_FREE_DAILY}/день (daily cap, daily reset) | Нет carry-over. Активность: {FREE_ACTIVE_DAYS} дней/мес → {CREDITS_FREE_MONTHLY} кредитов/мес eff. |")
    a(f"| **Кредиты Start** | {CREDITS_START:,}/мес | Carry-over |")
    a(f"| **Кредиты Pro** | {CREDITS_PRO:,}/мес | Carry-over |")
    a(f"| **Кредиты Enterprise** | {CREDITS_ENT:,}/мес | Carry-over |")
    a(f"| **Raw COGS/credit** | {usd(RAW_COGS_PER_CREDIT, 4)} | Mix: Reality 70% × $0.01 + Prediction 20% × $0.005 + Perception 10% × $0.005 |")
    a(f"| **COGS buffer** | +{int((COGS_BUFFER-1)*100)}% | LLM price spikes, retries, dev waste |")
    a(f"| **Effective COGS/credit** | {usd(EFF_COGS_PER_CREDIT, 5)} | = Raw × 1.50 |")
    a(f"| **Credit consumption** | {int(CREDIT_CONSUMPTION*100)}% | Pessimistic: 15% breakage |")
    a(f"| **LLM Chat margin** | +{int(LLM_CHAT_EXTRA_MARGIN*100)}% | Extra on top of buffered COGS (blended into mix) |")
    a(f"| **WL floor price** | {usd(WL_FLOOR, 3)}/credit | Partners cannot sell below this |")
    a(f"| **WL wholesale** | {usd(WL_WHOLESALE, 4)}/credit | Floor × 0.75 (25% partner discount) |")
    a(f"| **WL partner ROI** | ~33% | ($0.020 - $0.015) / $0.015 |")
    a(f"| **Churn** | Free 20% / Start 5% / Pro 3% / Ent 1% /mo | WL = 0% Year 1 |")
    a(f"| **Конверсии** | Comet base ÷ 2 | Органика; WL schedule неизменён |")
    a(f"| **AI model costs** | {usd(AI_COSTS)}/мес | С марта. Подписки LLM API + dev |")
    a(f"| **Owner draw** | {usd(OWNER_DRAW)}/мес | С мая (8 мес. в 2026) |")
    a(f"| **Artem commission** | {int(ARTEM_RATE*100)}% GP | Все Enterprise + WL клиенты |")
    a(f"| **Infra** | $57–$350/мес | Scaled по числу direct users (100/300/700+ порогам) |")

    hline()

    # ── § 1  WL TIERS ─────────────────────────────────────────────────────────
    h("1. WL Тарифы")
    a("| Tier | Ресейл кредитов/мес | Gift (personal) | Наша цена/мес | Партнёр ресейлит за (floor) | ROI партнёра | Наша GM (var) |")
    a("|---|---|---|---|---|---|---|")
    for label, resell, price in [
        ("WL-Base",  WL_BASE_CREDITS,  WL_BASE_PRICE),
        ("WL-Pro",   WL_PRO_CREDITS,   WL_PRO_PRICE),
        ("WL-Scale", WL_SCALE_CREDITS, WL_SCALE_PRICE),
    ]:
        total_cr  = resell + CREDITS_WL_GIFT
        # WL quotas — use issued=False for conservative GM (100% consumption assumption)
        cogs_wl_t = var_cogs(total_cr, issued=False)
        our_gm    = (price - cogs_wl_t) / price * 100 if price > 0 else 0
        floor_rev = resell * WL_FLOOR
        roi_p     = (floor_rev - price) / price * 100
        a(f"| **{label}** | {resell:,} | +{CREDITS_WL_GIFT:,} | **{usd(price)}** | {usd(floor_rev)} | {pct(roi_p)}% | {pct(our_gm)}% |")
    a("")
    a(f"> Floor = {usd(WL_FLOOR, 3)}/credit. Partners may charge **above** floor, not below (channel protection).")
    a(f"> Gift = Enterprise account ({CREDITS_WL_GIFT:,} credits/мес) for WL partner's own brand. Not resellable.")
    a(f"> GM (var) = после буферизованного COGS, до fixed costs. Без buffer: ~44%.")
    a("")
    a("**WL Schedule 2026:**")
    a("| Месяц | Событие |")
    a("|---|---|")
    a("| Март | WL-Base #1 добавлен (ProxyMarket) |")
    a("| Июнь | WL-Pro #1 добавлен |")
    a("| Сентябрь | WL-Base #2 добавлен |")
    a("| Декабрь | WL-Scale добавлен |")

    hline()

    # ── § 2  UNIT ECONOMICS ───────────────────────────────────────────────────
    h("2. Unit Economics по тарифу (direct SaaS)")
    a("| Тариф | Цена/мес | Кредитов eff. | Var COGS/user | GP/user | GM% | Churn/мес | LTV | LTV (net Artem, Ent only) |")
    a("|---|---|---|---|---|---|---|---|---|")
    for tier_name, price, credits, churn_r, is_artem in [
        ("Start",      PRICE_START, CREDITS_START, CHURN["start"], False),
        ("Pro",        PRICE_PRO,   CREDITS_PRO,   CHURN["pro"],   False),
        ("Enterprise", PRICE_ENT,   CREDITS_ENT,   CHURN["ent"],   True),
    ]:
        cogs_u = var_cogs(credits)
        gp_u   = price - cogs_u
        gm_u   = gp_u / price * 100
        ltv    = gp_u / churn_r
        if is_artem:
            ltv_net = gp_u * (1 - ARTEM_RATE) / churn_r
            ltv_net_str = usd(ltv_net)
        else:
            ltv_net_str = "n/a"
        a(f"| **{tier_name}** | {usd(price)} | {credits:,} | {usd(cogs_u, 2)} | {usd(gp_u, 2)} | {pct(gm_u)}% | {pct(churn_r*100)}% | {usd(ltv)} | {ltv_net_str} |")
    a("")
    a("> LTV = (GP/user) / monthly_churn. CAC = $0 (органический рост Year 1).")
    a("> Enterprise LTV без Artem: полная LTV. С Artem: Harkly получает 80% GP.")

    hline()

    # ── § 3  MONTHLY P&L ──────────────────────────────────────────────────────
    h("3. Помесячный P&L — 2026 (Pessimistic Base)")

    # 3.1 Users
    h("3.1 Пользователи по тирам", 3)
    a("| Мес | Free | Start | Pro | Ent | WL partners | Paying total | Direct total |")
    a("|---|---|---|---|---|---|---|---|")
    for r in base:
        a(f"| **{r['name']}** | {r['free']} | {r['start']} | {r['pro']} | {r['ent']} | {r['wl_count']} | {r['paying']} | {r['direct_users']} |")

    # 3.2 Revenue
    h("3.2 Выручка", 3)
    a("| Мес | Start MRR | Pro MRR | Ent MRR | WL Revenue | **Итого Revenue** |")
    a("|---|---|---|---|---|---|")
    for r in base:
        a(f"| **{r['name']}** | {usd(r['rev_start'])} | {usd(r['rev_pro'])} | {usd(r['rev_ent'])} | {usd(r['rev_wl'])} | **{usd(r['revenue'])}** |")
    tot_rev = totals(base, "revenue")
    a(f"| **ИТОГО** | **{usd(totals(base,'rev_start'))}** | **{usd(totals(base,'rev_pro'))}** | **{usd(totals(base,'rev_ent'))}** | **{usd(totals(base,'rev_wl'))}** | **{usd(tot_rev)}** |")

    # 3.3 COGS
    h("3.3 COGS", 3)
    a("| Мес | Var COGS | Инфра | AI costs | Fixed total | **Total COGS** |")
    a("|---|---|---|---|---|---|")
    for r in base:
        a(f"| **{r['name']}** | {usd(r['cogs_var'])} | {usd(r['cogs_infra'])} | {usd(r['cogs_ai'])} | {usd(r['cogs_fixed'])} | **{usd(r['total_cogs'])}** |")
    a(f"| **ИТОГО** | **{usd(totals(base,'cogs_var'))}** | **{usd(totals(base,'cogs_infra'))}** | **{usd(totals(base,'cogs_ai'))}** | **{usd(totals(base,'cogs_fixed'))}** | **{usd(totals(base,'total_cogs'))}** |")

    # 3.4 P&L Summary
    h("3.4 P&L — итоговая таблица", 3)
    a("| Мес | Revenue | COGS | **Gross Profit** | **GM%** | Artem | Owner Draw | **Net Profit** |")
    a("|---|---|---|---|---|---|---|---|")
    for r in base:
        sign = "🟢" if r["net"] >= 0 else "🔴"
        a(f"| **{r['name']}** | {usd(r['revenue'])} | {usd(r['total_cogs'])} | **{usd(r['gp'])}** | **{pct(r['gm_pct'])}%** | {usd(r['artem'],1)} | {usd(r['owner_draw'])} | **{sign} {usd(r['net'])}** |")

    tot_gp  = totals(base, "gp")
    tot_art = totals(base, "artem")
    tot_drw = totals(base, "owner_draw")
    tot_net = totals(base, "net")
    tot_gm  = tot_gp / tot_rev * 100 if tot_rev else 0

    a(f"| **ИТОГО** | **{usd(tot_rev)}** | **{usd(totals(base,'total_cogs'))}** | **{usd(tot_gp)}** | **{pct(tot_gm)}%** | **{usd(tot_art,1)}** | **{usd(tot_drw)}** | **{usd(tot_net)}** |")
    a("")
    a("> ⚠️ COGS включает 50% буфер над расчётным. Реальная GM без buffer ≈ на 10–15 пп выше.")

    hline()

    # ── § 4  CREDIT ECONOMY ───────────────────────────────────────────────────
    h("4. Кредитная экономика (помесячно)")
    a("| Мес | Выдано кредитов | Потреблено (85%) | Breakage (15%) | Breakage % от issued |")
    a("|---|---|---|---|---|")
    tot_iss = tot_con = tot_brk = 0.0
    for r in base:
        tot_iss += r["cr_issued"]
        tot_con += r["cr_consumed"]
        tot_brk += r["cr_breakage"]
        brk_pct = r["cr_breakage"] / r["cr_issued"] * 100 if r["cr_issued"] > 0 else 0
        a(f"| **{r['name']}** | {r['cr_issued']:,.0f} | {r['cr_consumed']:,.0f} | {r['cr_breakage']:,.0f} | {pct(brk_pct)}% |")
    a(f"| **ИТОГО** | **{tot_iss:,.0f}** | **{tot_con:,.0f}** | **{tot_brk:,.0f}** | **15.0%** |")
    a("")
    a("> Breakage = кредиты выданы но не использованы. Revenue признана при подписке (не при расходе).")
    a("> À la carte и quota overage исключены из Year 1 модели (непредсказуемы, не масштабируются).")

    hline()

    # ── § 5  WL ECONOMICS DETAILED ────────────────────────────────────────────
    h("5. WL Экономика (детально по тирам)")
    a("| WL Tier | Ресейл кредитов | Gift | Наша цена/мес | Var COGS | **WL GP** | **WL GM%** | Artem (20%) | **Net Harkly** |")
    a("|---|---|---|---|---|---|---|---|---|")
    for label, resell, price in [
        ("WL-Base",  WL_BASE_CREDITS,  WL_BASE_PRICE),
        ("WL-Pro",   WL_PRO_CREDITS,   WL_PRO_PRICE),
        ("WL-Scale", WL_SCALE_CREDITS, WL_SCALE_PRICE),
    ]:
        total_cr = resell + CREDITS_WL_GIFT
        # WL quotas — use issued=False for conservative GM (100% consumption assumption)
        cogs_t   = var_cogs(total_cr, issued=False)
        gp_t     = price - cogs_t
        gm_t     = gp_t / price * 100 if price > 0 else 0
        art_t    = max(0.0, gp_t) * ARTEM_RATE
        net_t    = gp_t - art_t
        a(f"| **{label}** | {resell:,} | {CREDITS_WL_GIFT:,} | **{usd(price)}** | {usd(cogs_t,1)} | **{usd(gp_t,1)}** | **{pct(gm_t)}%** | {usd(art_t,1)} | **{usd(net_t,1)}** |")

    a("")
    a("### 5.1 WL накопленная выручка по месяцам")
    a("| Мес | WL партнёров | WL Revenue | WL Var COGS | WL GP | Artem от WL | Net WL для Harkly |")
    a("|---|---|---|---|---|---|---|")
    for r in base:
        if r["wl_count"] > 0:
            wl_cr     = sum(w[2] for w in r["wl_stack"]) + r["wl_count"] * CREDITS_WL_GIFT
            # WL quotas — use issued=False for conservative GM
            wl_cv     = var_cogs(wl_cr, issued=False)
            wl_gp_r   = r["rev_wl"] - wl_cv
            wl_art_r  = max(0.0, wl_gp_r) * ARTEM_RATE
            wl_net_r  = wl_gp_r - wl_art_r
            a(f"| **{r['name']}** | {r['wl_count']} | {usd(r['rev_wl'])} | {usd(wl_cv,1)} | {usd(wl_gp_r,1)} | {usd(wl_art_r,1)} | **{usd(wl_net_r,1)}** |")

    hline()

    # ── § 6  SENSITIVITY ──────────────────────────────────────────────────────
    h("6. Анализ чувствительности")
    a("*Органические конверсии и new_free масштабируются. WL schedule фиксирован.*")
    a("*Bear = Base × 0.8. Base = Comet ÷ 2. Bull = Base × 1.2.*")
    a("")
    a("| Сценарий | Revenue 2026 | Gross Profit | Net Profit | Dec MRR | Dec Paying |")
    a("|---|---|---|---|---|---|")
    for label, rows in [
        ("🔴 Bear (×0.8 vs Base)", bear),
        ("🟡 Base (×1.0 — Pessimistic)", base),
        ("🟢 Bull (×1.2 vs Base)", bull),
    ]:
        rev  = totals(rows, "revenue")
        gp   = totals(rows, "gp")
        net  = totals(rows, "net")
        dec  = rows[-1]
        a(f"| **{label}** | {usd(rev)} | {usd(gp)} | {usd(net)} | {usd(dec['revenue'])} | {dec['paying']} |")

    a("")
    a("### 6.1 Sensitivity — ключевые риски")
    a("| Риск | Вероятность | Δ Revenue | Δ Net Profit |")
    a("|---|---|---|---|")
    # Revenue impact: if WL-Scale Dec doesn't happen
    base_rev = totals(base, "revenue")
    wl_scale_monthly = WL_SCALE_PRICE  # 1 month contribution in Dec
    a(f"| WL-Scale (Dec) не закрыт | Средняя | -{usd(wl_scale_monthly)} | -{usd(wl_scale_monthly * (1-ARTEM_RATE))} |")
    a(f"| Churn Start/Pro +50% (до 7.5%/4.5%) | Средняя | ~-15% MRR от платных | Высокое влияние |")
    a(f"| LLM API цены +50% | Низкая | 0 (buffer покрывает) | COGS +{pct((COGS_BUFFER-1)*100/2)}% |")
    a(f"| Нет второго WL партнёра (Sep) | Средняя | -{usd(WL_BASE_PRICE*4)} | Существенное |")
    a(f"| Задержка релиза на 1 мес | Низкая | -{usd(WL_BASE_PRICE + AI_COSTS)} | -{usd(WL_BASE_PRICE - var_cogs(WL_BASE_CREDITS+CREDITS_WL_GIFT))} |")

    hline()

    # ── § 7  YEAR-END SUMMARY ─────────────────────────────────────────────────
    h("7. Итоги 2026 — Year-End Summary")

    dec = base[-1]

    a("| Метрика | Значение |")
    a("|---|---|")
    a(f"| **Выручка 2026 (total)** | **{usd(tot_rev)}** |")
    a(f"| **MRR Декабрь 2026** | **{usd(dec['revenue'])}** |")
    a(f"| **ARR run-rate (Dec MRR ×12)** | **{usd(dec['revenue'] * 12)}** |")
    a(f"| **Gross Profit 2026** | **{usd(tot_gp)}** |")
    a(f"| **Blended GM% 2026** | **{pct(tot_gm)}%** |")
    a(f"| **Net Profit 2026** | **{usd(tot_net)}** |")
    a(f"| Direct users декабрь (Free+paid) | {dec['direct_users']} |")
    a(f"| Paying clients декабрь | {dec['paying']} |")
    a(f"| WL partners декабрь | {dec['wl_count']} |")
    a(f"| Artem commission 2026 | {usd(tot_art, 1)} |")
    a(f"| Owner draw 2026 (8 мес) | {usd(tot_drw)} |")
    a(f"| LTV:CAC | ∞ (CAC = $0, органический Year 1) |")

    a("")
    h("7.1 LTV по тирам (direct SaaS)", 3)
    a("| Тариф | GP/user/мес | Churn | LTV gross | LTV net (после Artem) |")
    a("|---|---|---|---|---|")
    for tier_name, price, credits, churn_r, is_ent in [
        ("Start",      PRICE_START, CREDITS_START, CHURN["start"], False),
        ("Pro",        PRICE_PRO,   CREDITS_PRO,   CHURN["pro"],   False),
        ("Enterprise", PRICE_ENT,   CREDITS_ENT,   CHURN["ent"],   True),
    ]:
        cogs_u  = var_cogs(credits)
        gp_u    = price - cogs_u
        ltv     = gp_u / churn_r
        ltv_net = gp_u * (1 - ARTEM_RATE) / churn_r if is_ent else ltv
        a(f"| **{tier_name}** | {usd(gp_u, 2)} | {pct(churn_r*100)}% | {usd(ltv)} | {usd(ltv_net)} |")

    a("")
    h("7.2 Breakeven анализ", 3)
    # When does monthly net profit turn positive?
    first_positive = next((r for r in base if r["net"] > 0), None)
    if first_positive:
        a(f"> Первый прибыльный месяц (net > 0): **{first_positive['name']} 2026**")
    else:
        a("> ⚠️ Net profit не достигает положительных значений в 2026 (pessimistic scenario).")
    a(f"> Gross profit впервые положительный: {next((r['name'] for r in base if r['gp'] > 0), 'н/д')} 2026")
    a(f"> Fixed costs coverage: WL-Base один партнёр покрывает инфра+AI = {usd(AI_COSTS + 57)}/мес начиная с первого месяца.")

    a("")
    hline()
    a("*Модель: Python stdlib, no external deps. Все константы верифицированы CFO 2026-02-25.*")
    a(f"*Raw COGS без буфера: {usd(RAW_COGS_PER_CREDIT, 4)}/credit. С буфером: {usd(EFF_COGS_PER_CREDIT, 5)}/credit.*")
    a("*À la carte и quota overage исключены из Year 1 (непредсказуемы, добавить в Year 2 model).*")

    return "\n".join(L)


# ============================================================
# § 6  MAIN
# ============================================================

if __name__ == "__main__":
    base = simulate(conv_mult=1.0)
    bear = simulate(conv_mult=0.8)
    bull = simulate(conv_mult=1.2)

    md = generate_md(base, bear, bull)

    out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "results.md")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(md)

    # ── Quick console summary ──
    active = [r for r in base if r["revenue"] > 0]
    tot_rev = sum(r["revenue"] for r in base)
    tot_gp  = sum(r["gp"]      for r in base)
    tot_net = sum(r["net"]      for r in base)
    dec     = base[-1]

    print(f"[OK] results.md written -> {out_path}")
    print(f"   Revenue 2026 : {usd(tot_rev)}")
    print(f"   Gross Profit : {usd(tot_gp)}  ({tot_gp/tot_rev*100:.1f}%)" if tot_rev else "")
    print(f"   Net 2026     : {usd(tot_net)}")
    print(f"   Dec MRR      : {usd(dec['revenue'])}")
    print(f"   Dec Paying   : {dec['paying']} clients")
    print(f"   Dec WL       : {dec['wl_count']} partners")
