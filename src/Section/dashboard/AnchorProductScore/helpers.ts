import { formatPercentage } from '@/lib/meta/fx'

export function tierFor(delta: number | null): 'anchor' | 'solo' | 'neutral' {
  if (delta === null) {
    return 'neutral'
  }
  if (delta >= 0.1) {
    return 'anchor'
  }
  if (delta <= -0.1) {
    return 'solo'
  }
  return 'neutral'
}

export function formatDelta(delta: number | null): string {
  if (delta === null) {
    return '—'
  }
  return `${arrowForDelta(delta)} ${formatPercentage(Math.abs(delta), 0)} vs store`
}

function arrowForDelta(delta: number): string {
  if (delta > 0) {
    return '↗'
  }
  if (delta < 0) {
    return '↘'
  }
  return '→'
}
