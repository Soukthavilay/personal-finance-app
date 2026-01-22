/**
 * Format a number as USD currency
 * @param amount - The number to format
 * @returns Formatted string (e.g. "$1,234.56")
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
