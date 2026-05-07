export interface TopCriteria {
  readonly minSpend: number
  readonly topMinRoas: number
  readonly underMaxRoas: number
}

export const DEFAULT_TOP_CRITERIA: TopCriteria = {
  minSpend: 50,
  topMinRoas: 4,
  underMaxRoas: 2,
}

const SHORT_RANGE_MIN_SPEND = 15
const SHORT_RANGE_PRESETS: ReadonlySet<string> = new Set(['today', 'yesterday'])

export function defaultCriteriaForPreset(preset: string): TopCriteria {
  if (SHORT_RANGE_PRESETS.has(preset)) {
    return { ...DEFAULT_TOP_CRITERIA, minSpend: SHORT_RANGE_MIN_SPEND }
  }
  return DEFAULT_TOP_CRITERIA
}

export const CRITERIA_QUERY_KEYS = {
  minSpend: 'minSpend',
  topMinRoas: 'minRoas',
  underMaxRoas: 'underMaxRoas',
} as const
