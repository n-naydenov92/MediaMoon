import {
  compareNumeric,
  stringifyFilterRules,
  type FilterField,
  type FilterRule,
} from '@/lib/meta/filterRules'
import type { CreativeElement, ElementMetrics } from './decompose'
import type { ElementTabId, PresetDef, PresetKey, SortDirection, SortFieldId } from './config'

const SORT_ACCESSORS: Record<SortFieldId, (m: ElementMetrics, used: number) => number> = {
  roas: (m) => m.roas,
  spend: (m) => m.spend,
  revenue: (m) => m.revenue,
  ctr: (m) => m.ctr,
  purchases: (m) => m.purchases,
  impressions: (m) => m.impressions,
  usedInAds: (_m, used) => used,
}

export interface RankedElement<T> {
  readonly rank: number
  readonly item: T
}

function sortValue<T extends { metrics: ElementMetrics; usedInAds: number }>(
  item: T,
  field: SortFieldId,
): number {
  return SORT_ACCESSORS[field](item.metrics, item.usedInAds)
}

export function rankElements<T extends { metrics: ElementMetrics; usedInAds: number }>(
  elements: readonly T[],
  field: SortFieldId,
  direction: SortDirection = 'desc',
): readonly RankedElement<T>[] {
  const factor = direction === 'asc' ? 1 : -1
  return [...elements]
    .sort((a, b) => factor * (sortValue(a, field) - sortValue(b, field)))
    .map((item, index) => ({ rank: index + 1, item }))
}

// Numeric metric a filter field reads off an element. Fields outside this map
// (or non-numeric rule values) pass through untouched — same lenient stance as
// the server filter in api/meta-ads/ads.
const METRIC_VALUE: Partial<Record<FilterField, (m: ElementMetrics) => number>> = {
  spend: (m) => m.spend,
  revenue: (m) => m.revenue,
  roas: (m) => m.roas,
  purchases: (m) => m.purchases,
  cpp: (m) => m.cpp,
  ctr: (m) => m.ctr,
  cplpv: (m) => m.cplpv,
  impressions: (m) => m.impressions,
}

function numericMatch(metrics: ElementMetrics, rule: FilterRule): boolean {
  const accessor = METRIC_VALUE[rule.field]
  if (!accessor || typeof rule.value !== 'number') {
    return true
  }
  return compareNumeric(rule.operator, accessor(metrics), rule.value)
}

export function textMatchesRules(metrics: ElementMetrics, rules: readonly FilterRule[]): boolean {
  return rules.every((rule) => numericMatch(metrics, rule))
}

export function creativeMatchesRules(c: CreativeElement, rules: readonly FilterRule[]): boolean {
  return rules.every((rule) => {
    if (rule.field === 'creativeType') {
      return c.creativeType === rule.value
    }
    return numericMatch(c.metrics, rule)
  })
}

// Which preset (if any) the current rule set exactly equals — drives chip
// highlighting. Empty rules → 'all'; an edited/extra rule → null (custom).
export function activePresetKey(
  rules: readonly FilterRule[],
  presets: readonly PresetDef[],
): PresetKey | null {
  const signature = stringifyFilterRules(rules)
  return presets.find((p) => stringifyFilterRules(p.rules) === signature)?.key ?? null
}

export function matchesSearch(haystack: string, query: string): boolean {
  const q = query.trim().toLowerCase()
  return q === '' || haystack.toLowerCase().includes(q)
}

export function tabKind(tab: ElementTabId): 'creative' | 'primary' | 'headline' | 'url' {
  switch (tab) {
    case 'creatives':
      return 'creative'
    case 'primary':
      return 'primary'
    case 'headline':
      return 'headline'
    case 'urls':
      return 'url'
  }
}
