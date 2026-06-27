// Currency helpers shared across MiFi.
// Rates are fetched live (base USD) in App.jsx; everything converts through them.

export const CURRENCIES = [
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'CAD', name: 'Canadian Dollar' },
];

export const DEFAULT_BASE = 'NGN';

// Convert an amount from one currency to another using USD-based rates.
// If we don't have rates (or the codes), we return the amount unchanged so
// nothing ever crashes — it just shows as-is.
export function convert(amount, from, to, rates) {
  const n = amount || 0;
  if (from === to) return n;
  if (!rates || !rates[from] || !rates[to]) return n;
  return n * (rates[to] / rates[from]);
}

// The currency symbol for a code, e.g. NGN -> ₦, USD -> $.
export function symbolOf(code) {
  try {
    return (
      new Intl.NumberFormat('en-US', { style: 'currency', currency: code, currencyDisplay: 'narrowSymbol' })
        .formatToParts(0)
        .find((p) => p.type === 'currency')?.value || code
    );
  } catch {
    return code;
  }
}

// Format an amount in a given currency, e.g. money(1500, 'NGN') -> "₦1,500".
export function money(amount, code, max) {
  const value = amount || 0;
  const m = max ?? (Math.abs(value) >= 1000 ? 0 : 2);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: m,
      minimumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(m)}`;
  }
}
