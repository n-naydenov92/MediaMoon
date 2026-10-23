import type { ChartPalette } from '@/lib/charts/spendChartPalette'
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
