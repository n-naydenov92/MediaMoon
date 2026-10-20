const MS_PER_SECOND = 1000
const SECONDS_PER_MINUTE = 60

export function formatRemaining(ms: number): string {
  const totalSeconds = Math.ceil(ms / MS_PER_SECOND)
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE)
  const seconds = totalSeconds % SECONDS_PER_MINUTE
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
