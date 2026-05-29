const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  BGN: 'лв',
  CAD: 'CA$',
  AUD: 'A$',
  JPY: '¥',
}

export function currencyToSymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency.toUpperCase()] ?? currency
}
