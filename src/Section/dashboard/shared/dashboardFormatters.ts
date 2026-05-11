import { formatEur, formatPercentage } from '@/lib/meta/fx'

export const PLACEHOLDER = '—'

export function formatMoney(value: number | null): string {
  return value === null ? PLACEHOLDER : formatEur(value)
}

export function formatInteger(value: number | null): string {
  return value === null
    ? PLACEHOLDER
    : value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

export function formatIntegerValue(value: number): string {
  return value.toLocaleString('en-GB', { maximumFractionDigits: 0 })
}

export function formatRoas(value: number | null): string {
  return value === null ? PLACEHOLDER : `${value.toFixed(2)}x`
}

export function formatRoasValue(value: number): string {
  return `${value.toFixed(2)}x`
}

export function formatRate(value: number | null): string {
  return value === null ? PLACEHOLDER : formatPercentage(value, 2)
}

export function formatRateValue(value: number): string {
  return formatPercentage(value, 2)
}
