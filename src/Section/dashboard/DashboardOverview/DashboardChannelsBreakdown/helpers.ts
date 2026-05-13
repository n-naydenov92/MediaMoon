import type { AdChannelStats, SpendBreakdownPoint } from '@/types/dashboard'

export function deriveAdChannel(
  channel: 'meta' | 'googleAds',
  spendBreakdown: readonly SpendBreakdownPoint[],
): AdChannelStats {
  const point = spendBreakdown.find((p) => p.channel === channel)
  const spend = point?.spend ?? null
  const wired = spend !== null && spend > 0
  return {
    wired,
    spend: wired ? spend : null,
    revenue: null,
    roas: null,
    orders: null,
    cpo: null,
    ctr: null,
    checkoutRate: null,
    costPerVisitor: null,
  }
}
