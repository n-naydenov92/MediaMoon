import type { BrandId } from '@/types'
import { rangeForCommerce } from '@/lib/commerce/rangeInTimezone'
import { resolveAnalyticsConfig, resolveCommerceConfig } from '@/lib/tenancy'
import {
  fetchAnalyticsRange,
  type AnalyticsRangeResult,
} from '@/lib/gateways/GoogleAnalyticsGateway'
import type { MarketSelection } from '@/lib/markets'
import { convertToEur } from '@/lib/meta/fx'
import type { DateRangeSelection } from '@/lib/meta/dateRange'

export async function fetchAnalyticsForBrand(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
  market: MarketSelection,
): Promise<AnalyticsRangeResult | null> {
  const provider = await resolveAnalyticsConfig(brandId)
  if (!provider) {
    return null
  }
  const range = rangeForCommerce(dateSelection, provider.timezone)
  const result = await fetchAnalyticsRange(provider, range.from, range.to, market)
  const commerce = await resolveCommerceConfig(brandId)
  if (!commerce) {
    return result
  }
  const reportingCurrency = commerce.currency
  return {
    ...result,
    breakdowns: {
      ...result.breakdowns,
      trafficSources: result.breakdowns.trafficSources.map((p) => ({
        ...p,
        revenue: convertToEur(p.revenue, reportingCurrency),
      })),
    },
  }
}
