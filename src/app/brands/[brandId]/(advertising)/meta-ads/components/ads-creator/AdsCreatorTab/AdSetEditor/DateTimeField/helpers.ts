export function parseIsoSafe(iso: string): Date | null {
  if (!iso) {
    return null
  }
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date
}

export function pickHour(date: Date | null): number {
  if (!date) {
    return 12
  }
  return date.getHours()
}

export function pickMinute(date: Date | null): number {
  if (!date) {
    return 0
  }
  return date.getMinutes()
}

export function combineDateAndTime(day: Date, hour: number, minute: number): string {
  const next = new Date(day)
  next.setHours(hour)
  next.setMinutes(minute)
  next.setSeconds(0)
  next.setMilliseconds(0)
  return next.toISOString()
}

export function formatDateTimeDisplay(iso: string): string {
  const date = parseIsoSafe(iso)
  if (!date) {
    return ''
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  })
}
