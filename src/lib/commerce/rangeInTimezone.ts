import {
  rangeFromSelection,
  type CustomRange,
  type DateRangeSelection,
} from '@/lib/meta/dateRange'

const MS_PER_DAY = 86_400_000

export function rangeForCommerce(
  selection: DateRangeSelection,
  timezone: string,
): CustomRange {
  if (selection.kind === 'custom') {
    return selection.range
  }
  const todayMs = Date.now()
  const today = formatInTimezone(new Date(todayMs), timezone)
  switch (selection.preset) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday': {
      const yesterday = formatInTimezone(new Date(todayMs - MS_PER_DAY), timezone)
      return { from: yesterday, to: yesterday }
    }
    case 'last_7d':
      return {
        from: formatInTimezone(new Date(todayMs - 7 * MS_PER_DAY), timezone),
        to: formatInTimezone(new Date(todayMs - MS_PER_DAY), timezone),
      }
    case 'last_30d':
      return {
        from: formatInTimezone(new Date(todayMs - 30 * MS_PER_DAY), timezone),
        to: formatInTimezone(new Date(todayMs - MS_PER_DAY), timezone),
      }
    case 'last_90d':
      return {
        from: formatInTimezone(new Date(todayMs - 90 * MS_PER_DAY), timezone),
        to: formatInTimezone(new Date(todayMs - MS_PER_DAY), timezone),
      }
    case 'this_month':
    case 'last_month':
      return rangeFromSelection(selection)
  }
}

function formatInTimezone(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
