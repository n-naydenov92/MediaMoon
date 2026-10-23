export function startOfUtcDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseIso(value: string): Date {
  const parts = value.split('-').map(Number)
  const [y, m, day] = [parts[0] ?? 1970, parts[1] ?? 1, parts[2] ?? 1]
  return new Date(y, m - 1, day)
}

export function formatHuman(d: Date): string {
  const month = d.toLocaleString('en-GB', { month: 'short' })
  return `${d.getDate()} ${month} ${d.getFullYear()}`
}
