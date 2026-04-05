// Provizor — Defectura Formula Functions
// F-21, F-22, F-23

/** F-21: Defectura Rate — % of unfulfilled requests */
export function defecturaRate(unfulfilledRequests: number, totalRequests: number): number {
  if (totalRequests === 0) return 0;
  return (unfulfilledRequests / totalRequests) * 100;
}

/** F-22: Lost Revenue from a single SKU OOS event */
export function lostRevenue(daysOOS: number, avgDailyUnits: number, sellingPrice: number): number {
  return daysOOS * avgDailyUnits * sellingPrice;
}

/** F-23: Fill Rate — % of requests fulfilled (complement of defectura rate) */
export function fillRate(defecturaRatePct: number): number {
  return Math.max(0, 100 - defecturaRatePct);
}
