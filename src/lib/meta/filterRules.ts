export const FILTER_FIELDS = [
  'spend',
  'revenue',
  'roas',
  'purchases',
  'cpp',
  'ctr',
  'cpm',
  'cpc',
  'lpv',
  'cplpv',
  'atc',
  'cpatc',
  'ic',
  'cpic',
  'impressions',
  'clicks',
  'status',
  'creativeType',
] as const

export type FilterField = typeof FILTER_FIELDS[number]

export const COMPARISON_OPERATORS = ['gt', 'gte', 'lt', 'lte', 'eq'] as const
export type ComparisonOperator = typeof COMPARISON_OPERATORS[number]

export const STATUS_VALUES = ['ACTIVE', 'PAUSED', 'ARCHIVED', 'DELETED'] as const
export type StatusValue = typeof STATUS_VALUES[number]

export const CREATIVE_TYPE_VALUES = ['image', 'video', 'unknown'] as const
export type CreativeTypeValue = typeof CREATIVE_TYPE_VALUES[number]

export type FilterValue = number | StatusValue | CreativeTypeValue

export interface FilterRule {
  readonly field: FilterField
  readonly operator: ComparisonOperator
  readonly value: FilterValue
}

interface FieldKind {
  readonly kind: 'number' | 'status' | 'creativeType'
  readonly operators: readonly ComparisonOperator[]
}

const NUMERIC_OPERATORS: readonly ComparisonOperator[] = ['gt', 'gte', 'lt', 'lte', 'eq']
const ENUM_OPERATORS: readonly ComparisonOperator[] = ['eq']

const FIELD_KINDS: Record<FilterField, FieldKind> = {
  spend: { kind: 'number', operators: NUMERIC_OPERATORS },
  revenue: { kind: 'number', operators: NUMERIC_OPERATORS },
  roas: { kind: 'number', operators: NUMERIC_OPERATORS },
  purchases: { kind: 'number', operators: NUMERIC_OPERATORS },
  cpp: { kind: 'number', operators: NUMERIC_OPERATORS },
  ctr: { kind: 'number', operators: NUMERIC_OPERATORS },
  cpm: { kind: 'number', operators: NUMERIC_OPERATORS },
  cpc: { kind: 'number', operators: NUMERIC_OPERATORS },
  lpv: { kind: 'number', operators: NUMERIC_OPERATORS },
  cplpv: { kind: 'number', operators: NUMERIC_OPERATORS },
  atc: { kind: 'number', operators: NUMERIC_OPERATORS },
  cpatc: { kind: 'number', operators: NUMERIC_OPERATORS },
  ic: { kind: 'number', operators: NUMERIC_OPERATORS },
  cpic: { kind: 'number', operators: NUMERIC_OPERATORS },
  impressions: { kind: 'number', operators: NUMERIC_OPERATORS },
  clicks: { kind: 'number', operators: NUMERIC_OPERATORS },
  status: { kind: 'status', operators: ENUM_OPERATORS },
  creativeType: { kind: 'creativeType', operators: ENUM_OPERATORS },
}

export function getFieldKind(field: FilterField): FieldKind['kind'] {
  return FIELD_KINDS[field].kind
}

export function operatorsFor(field: FilterField): readonly ComparisonOperator[] {
  return FIELD_KINDS[field].operators
}

export function isFilterField(value: string): value is FilterField {
  return (FILTER_FIELDS as readonly string[]).includes(value)
}

export function isComparisonOperator(value: string): value is ComparisonOperator {
  return (COMPARISON_OPERATORS as readonly string[]).includes(value)
}

export function isStatusValue(value: string): value is StatusValue {
  return (STATUS_VALUES as readonly string[]).includes(value)
}

export function isCreativeTypeValue(value: string): value is CreativeTypeValue {
  return (CREATIVE_TYPE_VALUES as readonly string[]).includes(value)
}

export function parseFilterRules(raw: string | null): readonly FilterRule[] {
  if (!raw) {
    return []
  }
  const rules: FilterRule[] = []
  for (const part of raw.split(';')) {
    const rule = parseSingleRule(part)
    if (rule) {
      rules.push(rule)
    }
  }
  return rules
}

export function stringifyFilterRules(rules: readonly FilterRule[]): string {
  return rules.map((r) => `${r.field}:${r.operator}:${String(r.value)}`).join(';')
}

function parseSingleRule(raw: string): FilterRule | null {
  const segments = raw.split(':')
  if (segments.length !== 3) {
    return null
  }
  const [fieldRaw, operatorRaw, valueRaw] = segments
  if (!fieldRaw || !operatorRaw || valueRaw === undefined) {
    return null
  }
  if (!isFilterField(fieldRaw) || !isComparisonOperator(operatorRaw)) {
    return null
  }
  if (!operatorsFor(fieldRaw).includes(operatorRaw)) {
    return null
  }
  const value = parseValueForField(fieldRaw, valueRaw)
  if (value === null) {
    return null
  }
  return { field: fieldRaw, operator: operatorRaw, value }
}

function parseValueForField(field: FilterField, raw: string): FilterValue | null {
  if (raw === '') {
    return null
  }
  const kind = getFieldKind(field)
  if (kind === 'number') {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }
  if (kind === 'status') {
    return isStatusValue(raw) ? raw : null
  }
  if (kind === 'creativeType') {
    return isCreativeTypeValue(raw) ? raw : null
  }
  return null
}

export const parseFilterValue = parseValueForField

// Shared numeric comparison so client predicates (Ads Creator library) and the
// server filter (api/meta-ads/ads) apply identical operator semantics.
export function compareNumeric(
  operator: ComparisonOperator,
  value: number,
  target: number,
): boolean {
  switch (operator) {
    case 'gt':
      return value > target
    case 'gte':
      return value >= target
    case 'lt':
      return value < target
    case 'lte':
      return value <= target
    case 'eq':
      return value === target
  }
}
