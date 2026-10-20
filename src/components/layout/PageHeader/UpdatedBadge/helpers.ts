import { formatTimestamp } from '@/lib/relativeTime'

const MS_PER_MINUTE = 60_000

// `now` ticks on an interval, so right after a fetch it can trail `fetchedAt`; counting
// from the later of the two keeps the remaining time from exceeding the cache's length.
export function buildFetchedTooltip(fetchedAt: number, cachedUntil: number | null, now: number): string {
  const fetched = `Last fetched at ${formatTimestamp(fetchedAt)}`
  if (cachedUntil === null) {
    return fetched
  }
  return `${fetched} · ${describeCacheExpiry(cachedUntil - Math.max(now, fetchedAt))}`
}

function describeCacheExpiry(remainingMs: number): string {
  if (remainingMs <= 0) {
    return 'cache expired'
  }
  if (remainingMs < MS_PER_MINUTE) {
    return 'cache expires in <1 min'
  }
  return `cache expires in ${Math.ceil(remainingMs / MS_PER_MINUTE)} min`
}
