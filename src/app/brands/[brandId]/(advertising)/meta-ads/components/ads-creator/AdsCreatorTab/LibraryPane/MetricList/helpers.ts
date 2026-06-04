import { formatEur, formatPercentage, formatRoas } from '@/lib/meta/fx'
import type { FilterRule } from '@/lib/meta/filterRules'
import type { ElementMetrics } from '../decompose'

// The stats shown on an element are bound to what the user filters on: Spend is
// always first, then every metric field present in the active rules. With no
// metric filter we fall back to a sensible default set.
export type CardMetricField =
  | 'spend'
  | 'roas'
  | 'cpp'
  | 'cplpv'
  | 'ctr'
  | 'purchases'
  | 'revenue'
  | 'impressions'

const CARD_METRIC_SET: ReadonlySet<string> = new Set<CardMetricField>([
  'spend',
  'roas',
  'cpp',
  'cplpv',
  'ctr',
  'purchases',
  'revenue',
  'impressions',
])

const DEFAULT_CARD_TAIL: readonly CardMetricField[] = ['roas', 'cpp', 'cplpv']

const CARD_METRIC_LABEL: Record<CardMetricField, string> = {
  spend: 'Spend',
  roas: 'ROAS',
  cpp: 'CPP',
  cplpv: 'Cost/LPV',
  ctr: 'CTR',
  purchases: 'Purchases',
  revenue: 'Revenue',
  impressions: 'Impressions',
}

export function cardMetricFields(rules: readonly FilterRule[]): readonly CardMetricField[] {
  const seen = new Set<CardMetricField>()
  const tail: CardMetricField[] = []
  for (const rule of rules) {
    if (rule.field === 'spend' || !CARD_METRIC_SET.has(rule.field)) {
      continue
    }
    const field = rule.field as CardMetricField
    if (!seen.has(field)) {
      seen.add(field)
      tail.push(field)
    }
  }
  return ['spend', ...(tail.length > 0 ? tail : DEFAULT_CARD_TAIL)]
}

export function cardMetricLabel(field: CardMetricField): string {
  return CARD_METRIC_LABEL[field]
}

export function formatCardMetric(field: CardMetricField, m: ElementMetrics): string {
  switch (field) {
    case 'spend':
      return formatEur(m.spend)
    case 'revenue':
      return formatEur(m.revenue)
    case 'cpp':
      return formatEur(m.cpp)
    case 'cplpv':
      return formatEur(m.cplpv)
    case 'roas':
      return formatRoas(m.roas)
    case 'ctr':
      return formatPercentage(m.ctr)
    case 'purchases':
      return m.purchases.toLocaleString('en-GB')
    case 'impressions':
      return m.impressions.toLocaleString('en-GB')
  }
}
