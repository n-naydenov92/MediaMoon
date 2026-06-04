import { formatEur, formatPercentage, formatRoas } from '@/lib/meta/fx'
import type { ComparisonOperator, FilterField, FilterRule } from './filterRules'

const FIELD_LABELS: Record<FilterField, string> = {
  spend: 'Spend',
  revenue: 'Revenue',
  roas: 'ROAS',
  purchases: 'Purchases',
  cpp: 'CPP',
  ctr: 'CTR',
  cpm: 'CPM',
  cpc: 'CPC',
  lpv: 'LPV',
  cplpv: 'Cost / LPV',
  atc: 'Adds to cart',
  cpatc: 'Cost / ATC',
  ic: 'Initiated checkout',
  cpic: 'Cost / IC',
  impressions: 'Impressions',
  clicks: 'Link clicks',
  status: 'Status',
  creativeType: 'Creative type',
}

const OPERATOR_LABELS: Record<ComparisonOperator, string> = {
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  eq: 'is',
}

const PERCENTAGE_FIELDS: ReadonlySet<FilterField> = new Set(['ctr'])
const ROAS_FIELDS: ReadonlySet<FilterField> = new Set(['roas'])
const CURRENCY_FIELDS: ReadonlySet<FilterField> = new Set([
  'spend',
  'revenue',
  'cpp',
  'cpm',
  'cpc',
  'cplpv',
  'cpatc',
  'cpic',
])

export function fieldLabel(field: FilterField): string {
  return FIELD_LABELS[field]
}

export function operatorLabel(op: ComparisonOperator): string {
  return OPERATOR_LABELS[op]
}

export function formatRuleValue(rule: FilterRule): string {
  if (typeof rule.value === 'string') {
    return rule.value
  }
  if (PERCENTAGE_FIELDS.has(rule.field)) {
    return formatPercentage(rule.value, 2)
  }
  if (ROAS_FIELDS.has(rule.field)) {
    return formatRoas(rule.value)
  }
  if (CURRENCY_FIELDS.has(rule.field)) {
    return formatEur(rule.value)
  }
  return rule.value.toLocaleString('en-GB', { maximumFractionDigits: 2 })
}
