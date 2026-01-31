/**
 * Format a number as USD currency
 * @param amount - The number to format
 * @returns Formatted string (e.g. "$1,234.56")
 */
export const formatCurrency = (amount: number, currency: string = "VND"): string => {
  const locale = currency === "VND" ? "vi-VN" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
};
