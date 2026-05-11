import type { BrandId } from '@/config/brands'
import { resolveAnalyticsProvider } from '@/config/analyticsProviders'
import { rangeForCommerce } from '@/lib/commerce/rangeInTimezone'
import { resolveCommerceProvider } from '@/lib/commerce/resolveProvider'
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
  const provider = resolveAnalyticsProvider(brandId)
  if (!provider) {
    return null
  }
  const range = rangeForCommerce(dateSelection, provider.timezone)
  const result = await fetchAnalyticsRange(provider, range.from, range.to, market)
  const commerce = resolveCommerceProvider(brandId)
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
