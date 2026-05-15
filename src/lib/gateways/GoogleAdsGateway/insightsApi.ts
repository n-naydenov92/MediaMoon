import type { GoogleAdsCredentials } from '@/config/googleAdsAccounts'
import type { CustomRange } from '@/lib/meta/dateRange'
import { getAccessToken } from './client'
import { callGoogleAdsSearch } from './http'
import {
  currencyFromRows,
  dailyTotalsFromRows,
  sumSearchRows,
  type GoogleAdsSearchResponse,
} from './parse'
import type { GoogleAdsAccountInsights } from './types'

const INSIGHTS_METRICS = [
  'metrics.cost_micros',
  'metrics.conversions',
  'metrics.conversions_value',
  'metrics.impressions',
  'metrics.clicks',
].join(', ')

export async function fetchAccountInsights(
  customerId: string,
  range: CustomRange,
  credentials: GoogleAdsCredentials,
): Promise<GoogleAdsAccountInsights> {
  const accessToken = await getAccessToken(credentials)
  const response = await callGoogleAdsSearch<GoogleAdsSearchResponse>(
    customerId,
    buildInsightsQuery(range),
    {
      accessToken,
      developerToken: credentials.developerToken,
      loginCustomerId: credentials.loginCustomerId,
    },
  )
  const rows = response.results ?? []
  return {
    customerId,
    currencyCode: currencyFromRows(rows),
    totals: sumSearchRows(rows),
    byDay: dailyTotalsFromRows(rows),
  }
}

function buildInsightsQuery(range: CustomRange): string {
  return `SELECT customer.currency_code, segments.date, ${INSIGHTS_METRICS} `
    + `FROM customer WHERE segments.date BETWEEN '${range.from}' AND '${range.to}'`
}
