import { BetaAnalyticsDataClient } from '@google-analytics/data'
import type { AnalyticsProviderConfig } from '@/config/analyticsProviders'

export interface AnalyticsDailyPoint {
  readonly date: string
  readonly sessions: number
  readonly activeUsers: number
}

export interface AnalyticsTotals {
  readonly sessions: number
  readonly activeUsers: number
}

export interface AnalyticsRangeResult {
  readonly totals: AnalyticsTotals
  readonly byDay: readonly AnalyticsDailyPoint[]
}

let cachedClient: BetaAnalyticsDataClient | null = null

export async function fetchAnalyticsRange(
  config: AnalyticsProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<AnalyticsRangeResult> {
  const client = getClient()
  const [response] = await client.runReport({
    property: `properties/${config.propertyId}`,
    dateRanges: [{ startDate: dateMin, endDate: dateMax }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }],
  })
  return mapResponse(response.rows ?? [])
}

function getClient(): BetaAnalyticsDataClient {
  if (cachedClient) {
    return cachedClient
  }
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON env var is not set')
  }
  const credentials = JSON.parse(raw) as Record<string, unknown>
  cachedClient = new BetaAnalyticsDataClient({ credentials, fallback: true })
  return cachedClient
}

interface ReportRow {
  readonly dimensionValues?: readonly { readonly value?: string | null }[] | null
  readonly metricValues?: readonly { readonly value?: string | null }[] | null
}

function mapResponse(rows: readonly ReportRow[]): AnalyticsRangeResult {
  const byDay = rows
    .map(toDailyPoint)
    .filter((p): p is AnalyticsDailyPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))
  const totals = byDay.reduce<AnalyticsTotals>(
    (acc, p) => ({
      sessions: acc.sessions + p.sessions,
      activeUsers: acc.activeUsers + p.activeUsers,
    }),
    { sessions: 0, activeUsers: 0 },
  )
  return { totals, byDay }
}

function toDailyPoint(row: ReportRow): AnalyticsDailyPoint | null {
  const date = formatGaDate(row.dimensionValues?.[0]?.value)
  if (!date) {
    return null
  }
  return {
    date,
    sessions: parseInteger(row.metricValues?.[0]?.value),
    activeUsers: parseInteger(row.metricValues?.[1]?.value),
  }
}

function formatGaDate(raw: string | null | undefined): string | null {
  if (!raw || raw.length !== 8) {
    return null
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

function parseInteger(raw: string | null | undefined): number {
  if (!raw) {
    return 0
  }
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : 0
}
