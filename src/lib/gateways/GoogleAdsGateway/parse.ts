import type { GoogleAdsDailyTotals, GoogleAdsTotals } from './types'

const MICROS_PER_UNIT = 1_000_000
const DEFAULT_CURRENCY = 'EUR'

export interface GoogleAdsSearchRow {
  customer?: { currencyCode?: string }
  segments?: { date?: string }
  metrics?: {
    costMicros?: string
    conversions?: number
    conversionsValue?: number
    impressions?: string
    clicks?: string
  }
}

export interface GoogleAdsSearchResponse {
  results?: GoogleAdsSearchRow[]
}

const EMPTY_TOTALS: GoogleAdsTotals = {
  spend: 0,
  revenue: 0,
  conversions: 0,
  impressions: 0,
  clicks: 0,
}

export function sumSearchRows(rows: readonly GoogleAdsSearchRow[]): GoogleAdsTotals {
  return rows.reduce<GoogleAdsTotals>((acc, row) => {
    const { metrics } = row
    if (!metrics) {
      return acc
    }
    return {
      spend: acc.spend + parseNumber(metrics.costMicros) / MICROS_PER_UNIT,
      revenue: acc.revenue + (metrics.conversionsValue ?? 0),
      conversions: acc.conversions + (metrics.conversions ?? 0),
      impressions: acc.impressions + parseNumber(metrics.impressions),
      clicks: acc.clicks + parseNumber(metrics.clicks),
    }
  }, EMPTY_TOTALS)
}

export function currencyFromRows(rows: readonly GoogleAdsSearchRow[]): string {
  return rows[0]?.customer?.currencyCode ?? DEFAULT_CURRENCY
}

// Rows carry `segments.date` only when the query SELECTs it; otherwise this yields an empty list.
export function dailyTotalsFromRows(rows: readonly GoogleAdsSearchRow[]): GoogleAdsDailyTotals[] {
  const rowsByDate = new Map<string, GoogleAdsSearchRow[]>()
  for (const row of rows) {
    const date = row.segments?.date
    if (!date) {
      continue
    }
    const bucket = rowsByDate.get(date)
    if (bucket) {
      bucket.push(row)
    } else {
      rowsByDate.set(date, [row])
    }
  }
  return Array.from(rowsByDate, ([date, dateRows]) => ({ date, ...sumSearchRows(dateRows) }))
}

function parseNumber(value: string | undefined): number {
  if (!value) {
    return 0
  }
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
