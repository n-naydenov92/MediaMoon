import type { SpendBreakdownPoint } from '@/types/dashboard'
import type { GoogleAdsChannelTotals, MetaChannelTotals } from './types'

export function buildSpendBreakdown(
  meta: MetaChannelTotals,
  googleAds: GoogleAdsChannelTotals | null,
): readonly SpendBreakdownPoint[] {
  const metaRoas = meta.spendEur > 0 && meta.revenueEur > 0
    ? meta.revenueEur / meta.spendEur
    : null
  return [
    { channel: 'meta', label: 'Meta', spend: meta.spendEur, roas: metaRoas },
    googleAdsSpendPoint(googleAds),
  ]
}

function googleAdsSpendPoint(totals: GoogleAdsChannelTotals | null): SpendBreakdownPoint {
  if (!totals || totals.spendEur <= 0) {
    return { channel: 'googleAds', label: 'Google Ads', spend: 0, roas: null }
  }
  const roas = totals.revenueEur > 0 ? totals.revenueEur / totals.spendEur : null
  return { channel: 'googleAds', label: 'Google Ads', spend: totals.spendEur, roas }
}
