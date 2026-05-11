import type { ChartPalette } from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'

export function pickPaletteColor(index: number, palette: ChartPalette): string {
  const ramp = [
    palette.channelMeta,
    palette.channelGoogle,
    palette.channelTiktok,
    palette.revenue,
    palette.metric,
  ]
  return ramp[index % ramp.length] ?? palette.channelMeta
}
