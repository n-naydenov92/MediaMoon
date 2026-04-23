import { LABELS } from './labels'

/**
 * Formats a UTC ISO date string as a human-readable relative time label.
 */
export function formatRelative(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMinutes = Math.floor(diffMs / 60_000)
  if (diffMinutes < 1) {
    return LABELS.relativeTime.justNow
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}${LABELS.relativeTime.mAgo}`
  }
  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}${LABELS.relativeTime.hAgo}`
  }
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}${LABELS.relativeTime.dAgo}`
}
