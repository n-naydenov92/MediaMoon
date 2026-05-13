export function formatHuman(iso: string): string {
  const parts = iso.split('-').map(Number)
  const [y, m, d] = [parts[0] ?? 1970, parts[1] ?? 1, parts[2] ?? 1]
  const date = new Date(Date.UTC(y, m - 1, d))
  const month = date.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
  return `${date.getUTCDate()} ${month}`
}
