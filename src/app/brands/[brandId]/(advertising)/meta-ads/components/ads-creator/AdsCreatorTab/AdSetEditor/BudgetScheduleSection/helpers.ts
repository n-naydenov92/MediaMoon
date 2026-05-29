function formatIso(iso: string): string {
  if (!iso) {
    return ''
  }
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function summarizeSchedule(startTime: string, endTime: string): string {
  const startLabel = startTime ? formatIso(startTime) : 'Starts immediately'
  const endLabel = endTime ? `Ends ${formatIso(endTime)}` : 'No end date'
  return `${startLabel} · ${endLabel}`
}
