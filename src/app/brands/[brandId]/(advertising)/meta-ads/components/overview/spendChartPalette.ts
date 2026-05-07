export interface ChartPalette {
  readonly spend: string
  readonly revenue: string
  readonly roas: string
  readonly grid: string
  readonly axis: string
}

export const PALETTE_DARK: ChartPalette = {
  spend: 'rgba(154, 154, 168, 0.6)',
  revenue: '#6c63ff',
  roas: '#10b981',
  grid: 'rgba(255, 255, 255, 0.06)',
  axis: 'rgba(255, 255, 255, 0.45)',
}

export const PALETTE_LIGHT: ChartPalette = {
  spend: 'rgba(74, 74, 88, 0.55)',
  revenue: '#5b52e5',
  roas: '#059669',
  grid: 'rgba(10, 10, 15, 0.06)',
  axis: 'rgba(10, 10, 15, 0.5)',
}
