const MS_PER_MINUTE = 60_000
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24

export function formatAgo(deltaMs: number): string {
  if (deltaMs < MS_PER_MINUTE) {
    return 'just now'
  }
  const minutes = Math.floor(deltaMs / MS_PER_MINUTE)
  if (minutes < MINUTES_PER_HOUR) {
    return `${minutes}m ago`
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR)
  if (hours < HOURS_PER_DAY) {
    return `${hours}h ago`
  }
  const days = Math.floor(hours / HOURS_PER_DAY)
  return `${days}d ago`
}

export function formatTimestamp(ms: number): string {
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}
