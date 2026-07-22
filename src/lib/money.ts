/** Money in integer minor units (fils/cents) — no floating-point rounding bugs. */
export function formatMoney(cents: number, currency = 'AED'): string {
  return new Intl.NumberFormat('en-AE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(cents / 100);
}

export function toCents(major: number | string): number {
  const n = typeof major === 'string' ? Number(major) : major;
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid amount: ${major}`);
  return Math.round(n * 100);
}

export function invoiceTotalCents(items: { quantity: number; unitPriceCents: number }[]): number {
  return items.reduce((sum, i) => sum + i.quantity * i.unitPriceCents, 0);
}
