import type { KlaviyoProviderConfig } from '@/config/klaviyoProviders'
import { getPlacedOrderMetricId } from './metrics'
import { fetchCampaignReport, fetchFlowReport } from './reports'
import type { KlaviyoRangeResult } from './types'

export async function fetchKlaviyoStatsRange(
  config: KlaviyoProviderConfig,
  dateMin: string,
  dateMax: string,
): Promise<KlaviyoRangeResult | null> {
  const metricId = await getPlacedOrderMetricId(config)
  if (!metricId) {
    return null
  }
  const timeframe = {
    start: `${dateMin}T00:00:00`,
    end: `${dateMax}T23:59:59`,
  }
  const [campaigns, flows] = await Promise.all([
    fetchCampaignReport(config, timeframe, metricId),
    fetchFlowReport(config, timeframe, metricId),
  ])
  return { campaigns, flows }
}
