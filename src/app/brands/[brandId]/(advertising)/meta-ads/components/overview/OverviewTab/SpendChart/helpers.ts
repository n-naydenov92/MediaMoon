import type { DailyPoint } from '@/lib/meta/aggregate'

export interface ChartRow extends DailyPoint {
  readonly roas: number
}

export function enrichWithRoas(data: readonly DailyPoint[]): readonly ChartRow[] {
  return data.map((d) => ({
    ...d,
    roas: d.spendEur > 0 ? d.revenueEur / d.spendEur : 0,
  }))
}

export function shortMoney(value: number): string {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}k`
  }
  return `€${value.toFixed(0)}`
}

export function shortRoas(value: number): string {
  return `${value.toFixed(1)}x`
}
