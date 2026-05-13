const RATES_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  GBP: 1.17,
  BGN: 0.51,
  RON: 0.20,
}

export function convertToEur(amount: number, currency: string): number {
  const rate = RATES_TO_EUR[currency.toUpperCase()]
  if (rate === undefined) {
    return amount
  }
  return amount * rate
}

export function isSupportedCurrency(currency: string): boolean {
  return RATES_TO_EUR[currency.toUpperCase()] !== undefined
}

export function formatEur(amount: number): string {
  return amount.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function formatCompactNumber(value: number): string {
  return value.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}

export function formatPercentage(ratio: number, fractionDigits: number = 2): string {
  return `${(ratio * 100).toFixed(fractionDigits)}%`
}

export function formatRoas(roas: number): string {
  return `${roas.toFixed(2)}x`
}
