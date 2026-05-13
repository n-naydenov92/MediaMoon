import { parseDateRangeFromQuery } from '@/lib/meta/dateRange'

export function isSingleDayRange(
  selection: ReturnType<typeof parseDateRangeFromQuery>,
): boolean {
  if (selection.kind === 'preset') {
    return selection.preset === 'today' || selection.preset === 'yesterday'
  }
  return selection.range.from === selection.range.to
}
