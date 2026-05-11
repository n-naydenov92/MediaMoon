import type { SpendBreakdownPoint } from '@/types/dashboard'
import type { MetaChannelTotals } from './types'

export function buildSpendBreakdown(meta: MetaChannelTotals): readonly SpendBreakdownPoint[] {
  const metaRoas = meta.spendEur > 0 && meta.revenueEur > 0
    ? meta.revenueEur / meta.spendEur
    : null
  return [
    { channel: 'meta', label: 'Meta', spend: meta.spendEur, roas: metaRoas },
    { channel: 'googleAds', label: 'Google Ads', spend: 0, roas: null },
  ]
}
