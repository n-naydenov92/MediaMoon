import type { KlaviyoProviderConfig } from '@/config/klaviyoProviders'
import { BASE_URL, klaviyoFetch } from './http'
import type { KlaviyoBucketTotals } from './types'

export interface Timeframe {
  readonly start: string
  readonly end: string
}

const STATS_WITH_CONVERSIONS = [
  'recipients',
  'delivered',
  'opens_unique',
  'clicks_unique',
  'conversions',
  'conversion_value',
] as const

const EMPTY_BUCKET: KlaviyoBucketTotals = {
  recipients: 0,
  delivered: 0,
  opensUnique: 0,
  clicksUnique: 0,
  conversions: 0,
  conversionValue: 0,
}

export function fetchCampaignReport(
  config: KlaviyoProviderConfig,
  timeframe: Timeframe,
  conversionMetricId: string,
): Promise<KlaviyoBucketTotals> {
  return fetchValuesReport(config, 'campaign-values-report', timeframe, conversionMetricId)
}

export function fetchFlowReport(
  config: KlaviyoProviderConfig,
  timeframe: Timeframe,
  conversionMetricId: string,
): Promise<KlaviyoBucketTotals> {
  return fetchValuesReport(config, 'flow-values-report', timeframe, conversionMetricId)
}

async function fetchValuesReport(
  config: KlaviyoProviderConfig,
  type: 'campaign-values-report' | 'flow-values-report',
  timeframe: Timeframe,
  conversionMetricId: string,
): Promise<KlaviyoBucketTotals> {
  const path =
    type === 'campaign-values-report'
      ? '/campaign-values-reports/'
      : '/flow-values-reports/'
  const body = {
    data: {
      type,
      attributes: {
        statistics: STATS_WITH_CONVERSIONS,
        timeframe,
        conversion_metric_id: conversionMetricId,
      },
    },
  }
  try {
    const res = await klaviyoFetch(config, `${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      return EMPTY_BUCKET
    }
    const json = (await res.json()) as ValuesReportResponse
    return aggregateResults(json.data?.attributes?.results ?? [])
  } catch {
    return EMPTY_BUCKET
  }
}

interface ValuesReportResponse {
  readonly data?: {
    readonly attributes?: {
      readonly results?: readonly {
        readonly statistics?: Readonly<Record<string, number>>
      }[]
    }
  }
}

function aggregateResults(
  rows: readonly { readonly statistics?: Readonly<Record<string, number>> }[],
): KlaviyoBucketTotals {
  let recipients = 0
  let delivered = 0
  let opensUnique = 0
  let clicksUnique = 0
  let conversions = 0
  let conversionValue = 0
  for (const row of rows) {
    const s = row.statistics ?? {}
    recipients += Number(s.recipients ?? 0)
    delivered += Number(s.delivered ?? 0)
    opensUnique += Number(s.opens_unique ?? 0)
    clicksUnique += Number(s.clicks_unique ?? 0)
    conversions += Number(s.conversions ?? 0)
    conversionValue += Number(s.conversion_value ?? 0)
  }
  return { recipients, delivered, opensUnique, clicksUnique, conversions, conversionValue }
}
