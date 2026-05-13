import type { ChartPalette } from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import type { FunnelStage } from '@/types/dashboard'

export function tierForConversion(conversion: number): 'good' | 'bad' | 'idle' {
  if (conversion >= 0.5) {
    return 'good'
  }
  if (conversion < 0.1) {
    return 'bad'
  }
  return 'idle'
}

export function stageColor(key: FunnelStage['key'], palette: ChartPalette): string {
  switch (key) {
    case 'homePage':
      return palette.channelMeta
    case 'productPage':
      return palette.metric
    case 'addToCart':
      return palette.channelTiktok
    case 'initiateCheckout':
      return '#ef4444'
    case 'purchase':
      return '#22c55e'
    default:
      return palette.channelMeta
  }
}
