export const DATE_PRESETS = [
  'today',
  'yesterday',
  'last_7d',
  'last_30d',
  'last_90d',
  'this_month',
  'last_month',
] as const

export type DatePreset = typeof DATE_PRESETS[number]

export const DATE_PRESET_LABELS: Record<DatePreset, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last_7d: 'Last 7 days',
  last_30d: 'Last 30 days',
  last_90d: 'Last 90 days',
  this_month: 'Month to date',
  last_month: 'Last month',
}

export const COMPARISON_LABELS: Record<DatePreset, string> = {
  today: 'dod',
  yesterday: 'dod',
  last_7d: 'wow',
  last_30d: 'mom',
  last_90d: 'qoq',
  this_month: 'mom',
  last_month: 'mom',
}

export const DEFAULT_DATE_PRESET: DatePreset = 'last_30d'

const MS_PER_DAY = 86_400_000

export interface CustomRange {
  readonly from: string
  readonly to: string
}

export type DateRangeSelection =
  | { readonly kind: 'preset'; readonly preset: DatePreset }
  | { readonly kind: 'custom'; readonly range: CustomRange }

export function isDatePreset(value: string): value is DatePreset {
  return (DATE_PRESETS as readonly string[]).includes(value)
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export function parseDateRangeFromQuery(params: URLSearchParams): DateRangeSelection {
  const from = params.get('from')
  const to = params.get('to')
  if (from && to && isIsoDate(from) && isIsoDate(to)) {
    return { kind: 'custom', range: { from, to } }
  }
  const presetRaw = params.get('datePreset')
  const preset = presetRaw && isDatePreset(presetRaw) ? presetRaw : DEFAULT_DATE_PRESET
  return { kind: 'preset', preset }
}

export function toMetaInsightsParams(selection: DateRangeSelection): Record<string, string> {
  if (selection.kind === 'preset') {
    return { date_preset: selection.preset }
  }
  return {
    time_range: JSON.stringify({ since: selection.range.from, until: selection.range.to }),
  }
}

export function previousPeriod(selection: DateRangeSelection): DateRangeSelection {
  if (selection.kind === 'custom') {
    return { kind: 'custom', range: shiftRangeBackwards(selection.range) }
  }
  const preset = PREVIOUS_PRESET[selection.preset]
  if (preset) {
    return { kind: 'preset', preset }
  }
  return { kind: 'custom', range: shiftRangeBackwards(presetToRange(selection.preset)) }
}

const PREVIOUS_PRESET: Partial<Record<DatePreset, DatePreset>> = {
  today: 'yesterday',
  this_month: 'last_month',
}

function presetToRange(preset: DatePreset): CustomRange {
  const today = startOfUtcDay(new Date())
  const todayIso = isoDate(today)
  switch (preset) {
    case 'today':
      return { from: todayIso, to: todayIso }
    case 'yesterday': {
      const y = isoDate(addDays(today, -1))
      return { from: y, to: y }
    }
    case 'last_7d':
      return { from: isoDate(addDays(today, -7)), to: isoDate(addDays(today, -1)) }
    case 'last_30d':
      return { from: isoDate(addDays(today, -30)), to: isoDate(addDays(today, -1)) }
    case 'last_90d':
      return { from: isoDate(addDays(today, -90)), to: isoDate(addDays(today, -1)) }
    case 'this_month':
      return { from: isoDate(firstOfMonth(today)), to: todayIso }
    case 'last_month': {
      const firstThis = firstOfMonth(today)
      const lastPrev = addDays(firstThis, -1)
      return { from: isoDate(firstOfMonth(lastPrev)), to: isoDate(lastPrev) }
    }
  }
}

function shiftRangeBackwards(range: CustomRange): CustomRange {
  const from = parseIso(range.from)
  const to = parseIso(range.to)
  const lengthDays = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1
  return {
    from: isoDate(addDays(from, -lengthDays)),
    to: isoDate(addDays(to, -lengthDays)),
  }
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setUTCDate(next.getUTCDate() + n)
  return next
}

function firstOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function parseIso(value: string): Date {
  const parts = value.split('-').map(Number)
  const [y, m, day] = [parts[0] ?? 1970, parts[1] ?? 1, parts[2] ?? 1]
  return new Date(Date.UTC(y, m - 1, day))
}

export function rangeFromSelection(selection: DateRangeSelection): CustomRange {
  if (selection.kind === 'custom') {
    return selection.range
  }
  return presetToRange(selection.preset)
}
