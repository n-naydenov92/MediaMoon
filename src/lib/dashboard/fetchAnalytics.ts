import type { BrandId } from '@/config/brands'
import { resolveAnalyticsProvider } from '@/config/analyticsProviders'
import { rangeForCommerce } from '@/lib/commerce/rangeInTimezone'
import {
  fetchAnalyticsRange,
  type AnalyticsRangeResult,
} from '@/lib/gateways/GoogleAnalyticsGateway'
import type { DateRangeSelection } from '@/lib/meta/dateRange'

export async function fetchAnalyticsForBrand(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
): Promise<AnalyticsRangeResult | null> {
  const provider = resolveAnalyticsProvider(brandId)
  if (!provider) {
    return null
  }
  const range = rangeForCommerce(dateSelection, provider.timezone)
  return fetchAnalyticsRange(provider, range.from, range.to)
}
