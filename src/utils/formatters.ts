/**
 * Formats Indian Currency (INR) and numbers with compact representation (Lakhs, Crores).
 * Example: 125000 -> "₹1,25,000"
 * Compact: 125000 -> "₹1.25L", 24000000 -> "₹2.40Cr"
 */

export function formatINR(value: number, options?: { compact?: boolean; hideSymbol?: boolean }): string {
  const { compact = false, hideSymbol = false } = options || {};
  const symbol = hideSymbol ? '' : '₹';

  if (compact) {
    const absVal = Math.abs(value);
    const sign = value < 0 ? '-' : '';

    if (absVal >= 10000000) {
      // Crores (1 Cr = 1,00,00,000)
      const cr = (absVal / 10000000).toFixed(2);
      return `${sign}${symbol}${parseFloat(cr)}Cr`;
    } else if (absVal >= 100000) {
      // Lakhs (1 Lakh = 1,00,000)
      const lakh = (absVal / 100000).toFixed(2);
      return `${sign}${symbol}${parseFloat(lakh)}L`;
    } else if (absVal >= 1000) {
      const k = (absVal / 1000).toFixed(1);
      return `${sign}${symbol}${parseFloat(k)}k`;
    }
    return `${sign}${symbol}${absVal.toLocaleString('en-IN')}`;
  }

  // Full Indian numbering system: 1,25,000
  const formatted = Math.round(value).toLocaleString('en-IN');
  return `${symbol}${formatted}`;
}

export function formatNumber(value: number, compact: boolean = false): string {
  if (compact) {
    if (value >= 10000000) return `${(value / 10000000).toFixed(2)}Cr`;
    if (value >= 100000) return `${(value / 100000).toFixed(2)}L`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toLocaleString('en-IN');
}

export function formatPercent(value: number, includeSign: boolean = true): string {
  const formatted = Math.abs(value).toFixed(1);
  if (!includeSign) return `${formatted}%`;
  return `${value >= 0 ? '+' : '-'}${formatted}%`;
}
