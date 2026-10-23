export interface ChartPalette {
  readonly spend: string
  readonly revenue: string
  readonly metric: string
  readonly grid: string
  readonly axis: string
  readonly channelMeta: string
  readonly channelGoogle: string
  readonly channelTiktok: string
}

export const PALETTE_DARK: ChartPalette = {
  spend: '#f5f5f7',
  revenue: '#6c63ff',
  metric: '#14b8a6',
  grid: 'rgba(255, 255, 255, 0.06)',
  axis: 'rgba(255, 255, 255, 0.45)',
  channelMeta: '#6c63ff',
  channelGoogle: '#14b8a6',
  channelTiktok: '#f59e0b',
}

export const PALETTE_LIGHT: ChartPalette = {
  spend: '#0a0a0f',
  revenue: '#5b52e5',
  metric: '#0d9488',
  grid: 'rgba(10, 10, 15, 0.06)',
  axis: 'rgba(10, 10, 15, 0.5)',
  channelMeta: '#5b52e5',
  channelGoogle: '#0d9488',
  channelTiktok: '#d97706',
}
