export type KpiTrend = 'up' | 'down' | 'flat'

const FLAT_THRESHOLD = 0.005

export function computeTrend(delta: number | undefined): KpiTrend {
  if (delta === undefined || Math.abs(delta) < FLAT_THRESHOLD) {
    return 'flat'
  }
  return delta > 0 ? 'up' : 'down'
}

export function arrowFor(delta: number): string {
  if (Math.abs(delta) < FLAT_THRESHOLD) {
    return '–'
  }
  return delta > 0 ? '▲' : '▼'
}
