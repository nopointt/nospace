// Provizor — Pure formula functions
// Reference: DEEP-0 Layer 5 (F-01..F-18, F-27..F-30, F-39)

// ─── P&L Formulas ───────────────────────────────────────────

/** F-01: Revenue (Товарооборот) */
export function revenue(sellingPrices: number[], unitsSold: number[]): number {
  return sellingPrices.reduce((sum, price, i) => sum + price * unitsSold[i], 0);
}

/** F-01 simplified: monthly revenue from single value */
export function revenueMonthly(monthlyRevenue: number): number {
  return monthlyRevenue;
}

/** F-02: COGS (Себестоимость) */
export function cogs(purchasePrices: number[], unitsSold: number[]): number {
  return purchasePrices.reduce((sum, price, i) => sum + price * unitsSold[i], 0);
}

/** F-02 simplified: COGS from revenue and markup */
export function cogsFromMarkup(revenue: number, markupPct: number): number {
  return revenue / (1 + markupPct / 100);
}

/** F-03: Gross Profit */
export function grossProfit(revenue: number, cogs: number): number {
  return revenue - cogs;
}

/** F-03: Gross Margin % */
export function grossMarginPct(revenue: number, cogs: number): number {
  if (revenue === 0) return 0;
  return ((revenue - cogs) / revenue) * 100;
}

/** F-04: Payroll Cost Ratio % */
export function payrollPct(payroll: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (payroll / revenue) * 100;
}

/** F-05: Rent & Occupancy Ratio % */
export function rentPct(rent: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (rent / revenue) * 100;
}

/** F-06: OPEX % */
export function opexTotal(payroll: number, rent: number, utilities: number, admin: number, software: number, marketing: number): number {
  return payroll + rent + utilities + admin + software + marketing;
}

export function opexPct(opex: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (opex / revenue) * 100;
}

/** F-07: EBITDA */
export function ebitda(grossProfit: number, opex: number): number {
  return grossProfit - opex;
}

export function ebitdaPct(ebitda: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (ebitda / revenue) * 100;
}

/** F-08: Net Profit */
export function netProfit(ebitda: number, depreciation: number, interest: number, taxRate: number): number {
  const preTax = ebitda - depreciation - interest;
  return preTax * (1 - taxRate / 100);
}

export function netMarginPct(netProfit: number, revenue: number): number {
  if (revenue === 0) return 0;
  return (netProfit / revenue) * 100;
}

// ─── Profitability Formulas ─────────────────────────────────

/** F-16: Realized Markup % (УТН — Уровень Торговой Наценки) */
export function realizedMarkupPct(revenue: number, cogs: number): number {
  if (cogs === 0) return 0;
  return ((revenue - cogs) / cogs) * 100;
}

/** F-18: CIS Profitability % (Рентабельность вложенных средств) */
export function cisProfitability(
  markupPct: number,
  daysOfInventory: number,
  creditorDays: number = 30,
  debtorDays: number = 0,
): number {
  if (daysOfInventory === 0) return 0;
  const turnoverMultiplier = 365 / daysOfInventory;
  const creditLeverage = creditorDays > 0 || debtorDays > 0
    ? creditorDays / (creditorDays + debtorDays)
    : 1;
  return markupPct * turnoverMultiplier * creditLeverage;
}

// ─── KZ Regulatory Formulas ─────────────────────────────────

/** F-17: KZ Regressive Markup Scale (February 2025, effective March 2025) */
const KZ_MARKUP_SCALE: Array<{ maxCost: number; markupPct: number }> = [
  { maxCost: 350, markupPct: 15.0 },
  { maxCost: 1_000, markupPct: 14.5 },
  { maxCost: 3_000, markupPct: 13.75 },
  { maxCost: 5_000, markupPct: 12.5 },
  { maxCost: 7_500, markupPct: 11.25 },
  { maxCost: 10_000, markupPct: 10.0 },
  { maxCost: 13_500, markupPct: 9.0 },
  { maxCost: 20_000, markupPct: 8.0 },
  { maxCost: 40_000, markupPct: 7.0 },
  { maxCost: 100_000, markupPct: 6.0 },
  { maxCost: Infinity, markupPct: 5.0 },
];

export { KZ_MARKUP_SCALE };

/** Get max allowed markup % for a regulated drug given its cost price */
export function maxRegulatedMarkup(costPrice: number): number {
  const tier = KZ_MARKUP_SCALE.find(t => costPrice <= t.maxCost);
  return tier?.markupPct ?? 5.0;
}

/** Get max allowed selling price for a regulated drug */
export function maxRegulatedPrice(costPrice: number): number {
  const markup = maxRegulatedMarkup(costPrice);
  return costPrice * (1 + markup / 100);
}

/** Check if a selling price violates the regulated ceiling */
export function isRegulatedViolation(costPrice: number, sellingPrice: number): boolean {
  return sellingPrice > maxRegulatedPrice(costPrice);
}

/** F-39: Blended margin for mixed regulated/free portfolio */
export function blendedMarginPct(
  regulatedSharePct: number,
  regulatedMarkupPct: number,
  freeMarkupPct: number,
): number {
  const regShare = regulatedSharePct / 100;
  const freeShare = 1 - regShare;
  const regMargin = regulatedMarkupPct / (100 + regulatedMarkupPct) * 100;
  const freeMargin = freeMarkupPct / (100 + freeMarkupPct) * 100;
  return regShare * regMargin + freeShare * freeMargin;
}

// ─── Channel Economics Formulas ─────────────────────────────

export interface ChannelData {
  name: string;
  revenue: number;
  commissionPct: number;
  fulfillmentCostPct: number;
}

/** F-27: Channel Revenue Share % */
export function channelSharePct(channelRevenue: number, totalRevenue: number): number {
  if (totalRevenue === 0) return 0;
  return (channelRevenue / totalRevenue) * 100;
}

/** F-28: Channel Net Margin % */
export function channelNetMarginPct(
  grossMarginPct: number,
  commissionPct: number,
  fulfillmentCostPct: number,
): number {
  return grossMarginPct - commissionPct - fulfillmentCostPct;
}

/** F-29: Blended channel margin across all channels */
export function blendedChannelMargin(channels: ChannelData[], grossMarginPct: number): number {
  const totalRevenue = channels.reduce((sum, c) => sum + c.revenue, 0);
  if (totalRevenue === 0) return 0;
  return channels.reduce((sum, c) => {
    const weight = c.revenue / totalRevenue;
    const netMargin = channelNetMarginPct(grossMarginPct, c.commissionPct, c.fulfillmentCostPct);
    return sum + weight * netMargin;
  }, 0);
}

/** F-30: Flag unprofitable channels */
export function unprofitableChannels(channels: ChannelData[], grossMarginPct: number): ChannelData[] {
  return channels.filter(c =>
    channelNetMarginPct(grossMarginPct, c.commissionPct, c.fulfillmentCostPct) < 0
  );
}
