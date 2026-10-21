import { buildUrl, callGraphApi } from './http'
import {
  INSIGHTS_FIELDS,
  sumInsightsRows,
  toDailyPoint,
  type GraphInsightsRow,
} from './insightsParsers'
import type { AccountInsights, InsightsDailyPoint } from './types'

const MAX_INSIGHTS_PAGES = 50
// Meta's default page is 25 rows — less than a month of daily points. A larger page
// keeps the common ranges to one call; longer ranges still follow `paging.next`.
const DAILY_ROWS_PAGE_SIZE = '100'
// Meta bug (Oct 2026, some accounts): with time_increment=1, asking for link clicks or
// actions in the same call returns spend, impressions and clicks as 0 on every day.
// Requested apart, both halves match the period totals exactly, so the daily series
// is two calls (together INSIGHTS_FIELDS) merged by date.
const DAILY_DELIVERY_FIELDS = 'spend,impressions,clicks'
const DAILY_CONVERSION_FIELDS = 'inline_link_clicks,actions,action_values'

interface GraphInsightsResponse {
  data?: GraphInsightsRow[]
  paging?: { next?: string }
}

export async function fetchAccountInsights(
  token: string,
  accountId: string,
  currency: string,
  dateParams: Record<string, string>,
  options: { readonly daily: boolean } = { daily: true },
): Promise<AccountInsights> {
  const totalsParams = { fields: INSIGHTS_FIELDS, level: 'account', ...dateParams }
  const totals = sumInsightsRows(await fetchInsightsRows(token, accountId, totalsParams))

  let daily: readonly InsightsDailyPoint[] = []
  if (options.daily) {
    daily = (await fetchDailyRows(token, accountId, dateParams)).map(toDailyPoint)
  }

  return { accountId, currency, totals, daily }
}

async function fetchDailyRows(
  token: string,
  accountId: string,
  dateParams: Record<string, string>,
): Promise<readonly GraphInsightsRow[]> {
  const dailyParams = { level: 'account', time_increment: '1', limit: DAILY_ROWS_PAGE_SIZE, ...dateParams }
  const [conversionRows, deliveryRows] = await Promise.all([
    fetchInsightsRows(token, accountId, { ...dailyParams, fields: DAILY_CONVERSION_FIELDS }),
    fetchInsightsRows(token, accountId, { ...dailyParams, fields: DAILY_DELIVERY_FIELDS }),
  ])
  const byDate = new Map<string, GraphInsightsRow>()
  for (const row of [...conversionRows, ...deliveryRows]) {
    const date = row.date_start ?? ''
    byDate.set(date, { ...byDate.get(date), ...row })
  }
  return [...byDate.values()].sort((a, b) => (a.date_start ?? '').localeCompare(b.date_start ?? ''))
}

export async function fetchInsightsRows(
  token: string,
  accountId: string,
  params: Record<string, string>,
): Promise<readonly GraphInsightsRow[]> {
  let url: string | null = buildUrl(`/${accountId}/insights`, token, params)
  const rows: GraphInsightsRow[] = []
  for (let page = 0; page < MAX_INSIGHTS_PAGES && url; page += 1) {
    const json: GraphInsightsResponse = await callGraphApi<GraphInsightsResponse>(url)
    rows.push(...(json.data ?? []))
    url = json.paging?.next ?? null
  }
  return rows
}
