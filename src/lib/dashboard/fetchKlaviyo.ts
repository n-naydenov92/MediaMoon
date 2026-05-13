import type { BrandId } from '@/config/brands'
import { resolveKlaviyoProvider } from '@/config/klaviyoProviders'
import * as KlaviyoGateway from '@/lib/gateways/KlaviyoGateway'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import { rangeFromSelection } from '@/lib/meta/dateRange'
import type { KlaviyoChannelStats } from '@/types/dashboard'
import { sumBuckets, toBucketStats } from './klaviyoTransforms'

export async function fetchKlaviyoForBrand(
  brandId: BrandId,
  dateSelection: DateRangeSelection,
): Promise<KlaviyoChannelStats | null> {
  const provider = resolveKlaviyoProvider(brandId)
  if (!provider) {
    return null
  }
  const range = rangeFromSelection(dateSelection)
  const result = await KlaviyoGateway.fetchKlaviyoStatsRange(provider, range.from, range.to)
  if (!result) {
    return null
  }
  const total = sumBuckets(result.campaigns, result.flows)
  return {
    wired: true,
    total: toBucketStats(total),
    flows: toBucketStats(result.flows),
    campaigns: toBucketStats(result.campaigns),
  }
}
