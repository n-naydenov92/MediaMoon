import { buildUrl, callGraphApi } from './http'
import {
  INSIGHTS_FIELDS,
  sumInsightsRows,
  toDailyPoint,
  type GraphInsightsRow,
} from './insightsParsers'
import type { AccountInsights, InsightsDailyPoint } from './types'

interface GraphInsightsResponse {
  data?: GraphInsightsRow[]
  error?: { message: string; type: string; code: number }
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
    const dailyParams = { ...totalsParams, time_increment: '1' }
    const dailyRows = await fetchInsightsRows(token, accountId, dailyParams)
    daily = dailyRows.map(toDailyPoint)
  }

  return { accountId, currency, totals, daily }
}

export async function fetchInsightsRows(
  token: string,
  accountId: string,
  params: Record<string, string>,
): Promise<readonly GraphInsightsRow[]> {
  const url = buildUrl(`/${accountId}/insights`, token, params)
  const json = await callGraphApi<GraphInsightsResponse>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return json.data ?? []
}
