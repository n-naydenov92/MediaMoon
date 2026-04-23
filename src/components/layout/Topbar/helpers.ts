import { LABELS } from '@/components/layout/labels'

/**
 * Formats the remaining time until a cache expiry ISO date string.
 * Returns a human-readable label such as "12m", "1h 5m", or "soon".
 */
export function formatRemaining(isoDate: string): string {
  const ms = new Date(isoDate).getTime() - Date.now()
  if (ms <= 0) {
    return LABELS.cacheStatus.soon
  }
  const minutesTotal = Math.floor(ms / 60_000)
  const hours = Math.floor(minutesTotal / 60)
  const minutes = minutesTotal % 60
  if (hours === 0) {
    return `${minutes}${LABELS.cacheStatus.minuteSuffix}`
  }
  return `${hours}${LABELS.cacheStatus.hourSuffix} ${minutes}${LABELS.cacheStatus.minuteSuffix}`
}
