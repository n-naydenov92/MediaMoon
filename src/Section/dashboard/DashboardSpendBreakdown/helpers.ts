import type { ChartPalette } from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import type { SpendChannel } from '@/types/dashboard'

export function channelColor(channel: SpendChannel, palette: ChartPalette): string {
  if (channel === 'meta') {
    return palette.channelMeta
  }
  if (channel === 'googleAds') {
    return palette.channelGoogle
  }
  return palette.channelTiktok
}
