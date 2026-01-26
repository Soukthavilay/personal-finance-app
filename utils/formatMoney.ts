export function formatMoney(amount: number, currency: string): string {
  const ccy = (currency || "USD").toUpperCase();
  const maximumFractionDigits = ccy === "VND" ? 0 : 2;

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: ccy,
    maximumFractionDigits,
  }).format(amount);
}
