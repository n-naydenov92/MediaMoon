// One config file drives the whole Element Browser: adding a tab, a sort metric,
// or a filter preset is an edit here, not a component change (OCP).

import type { FilterField, FilterRule } from '@/lib/meta/filterRules'
import {
  CPLPV_GOOD_MAX,
  CPLPV_WARNING_MAX,
  CPP_GOOD_MAX,
  CPP_WARNING_MAX,
  CTR_GOOD_MIN,
  CTR_WARNING_MIN,
  ROAS_GOOD_MIN,
} from '@/lib/meta/metricThresholds'
import { ROAS_WARNING_THRESHOLD } from '@/lib/meta/roasClassification'

export type ElementTabId = 'creatives' | 'primary' | 'headline' | 'urls'

export type SortFieldId =
  | 'roas'
  | 'spend'
  | 'revenue'
  | 'ctr'
  | 'purchases'
  | 'impressions'
  | 'usedInAds'

export type PresetKey = 'all' | 'winners' | 'underperformers' | 'video' | 'image'

export type SortDirection = 'asc' | 'desc'

export interface SortFieldDef {
  readonly id: SortFieldId
  readonly label: string
}

// A preset is just a named bundle of filter rules. Clicking it materialises the
// rules as editable pills (see ElementFilterChips) so the user always sees what
// "Winners" actually means — and can tweak or drop any threshold.
export interface PresetDef {
  readonly key: PresetKey
  readonly label: string
  readonly rules: readonly FilterRule[]
}

export interface TabDef {
  readonly id: ElementTabId
  readonly label: string
  readonly sortFields: readonly SortFieldDef[]
  readonly defaultSort: SortFieldId
  readonly presets: readonly PresetDef[]
}

const SORT_SPEND: SortFieldDef = { id: 'spend', label: 'Spend' }
const SORT_ROAS: SortFieldDef = { id: 'roas', label: 'ROAS' }
const SORT_REVENUE: SortFieldDef = { id: 'revenue', label: 'Revenue' }
const SORT_CTR: SortFieldDef = { id: 'ctr', label: 'Link CTR' }
const SORT_PURCHASES: SortFieldDef = { id: 'purchases', label: 'Purchases' }
const SORT_IMPRESSIONS: SortFieldDef = { id: 'impressions', label: 'Impressions' }
const SORT_USED: SortFieldDef = { id: 'usedInAds', label: 'Used in ads' }

const TEXT_SORT_FIELDS: readonly SortFieldDef[] = [
  SORT_ROAS,
  SORT_SPEND,
  SORT_REVENUE,
  SORT_CTR,
  SORT_PURCHASES,
  SORT_USED,
]

const CREATIVE_SORT_FIELDS: readonly SortFieldDef[] = [
  SORT_SPEND,
  SORT_ROAS,
  SORT_REVENUE,
  SORT_CTR,
  SORT_PURCHASES,
  SORT_IMPRESSIONS,
]

// Same thresholds that isWinnerRow / isUnderperformerRow apply, expressed as
// explicit rules so the pills the user sees and the filtering stay identical.
const WINNER_RULES: readonly FilterRule[] = [
  { field: 'roas', operator: 'gte', value: ROAS_GOOD_MIN },
  { field: 'cpp', operator: 'lte', value: CPP_GOOD_MAX },
  { field: 'ctr', operator: 'gte', value: CTR_GOOD_MIN },
  { field: 'cplpv', operator: 'lte', value: CPLPV_GOOD_MAX },
]

const UNDERPERFORMER_RULES: readonly FilterRule[] = [
  { field: 'roas', operator: 'lt', value: ROAS_WARNING_THRESHOLD },
  { field: 'cpp', operator: 'gt', value: CPP_WARNING_MAX },
  { field: 'ctr', operator: 'lt', value: CTR_WARNING_MIN },
  { field: 'cplpv', operator: 'gt', value: CPLPV_WARNING_MAX },
]

const VIDEO_RULES: readonly FilterRule[] = [
  { field: 'creativeType', operator: 'eq', value: 'video' },
]

const IMAGE_RULES: readonly FilterRule[] = [
  { field: 'creativeType', operator: 'eq', value: 'image' },
]

const PRESET_ALL: PresetDef = { key: 'all', label: 'All', rules: [] }
const PRESET_WINNERS: PresetDef = { key: 'winners', label: 'Winners', rules: WINNER_RULES }
const PRESET_UNDER: PresetDef = {
  key: 'underperformers',
  label: 'Underperformers',
  rules: UNDERPERFORMER_RULES,
}
const PRESET_VIDEO: PresetDef = { key: 'video', label: 'Video', rules: VIDEO_RULES }
const PRESET_IMAGE: PresetDef = { key: 'image', label: 'Image', rules: IMAGE_RULES }

const TEXT_PRESETS: readonly PresetDef[] = [PRESET_ALL, PRESET_WINNERS, PRESET_UNDER]
const CREATIVE_PRESETS: readonly PresetDef[] = [
  PRESET_ALL,
  PRESET_WINNERS,
  PRESET_VIDEO,
  PRESET_IMAGE,
]

// Fields offered in the "+ Add filter" dialog. Limited to the metrics each
// element actually carries (ElementMetrics); creatives additionally filter by
// type, which doubles as the Video / Image presets.
const TEXT_FILTER_FIELDS: readonly FilterField[] = [
  'spend',
  'revenue',
  'roas',
  'purchases',
  'cpp',
  'ctr',
  'cplpv',
  'impressions',
]
const CREATIVE_FILTER_FIELDS: readonly FilterField[] = [...TEXT_FILTER_FIELDS, 'creativeType']

export function filterFieldsFor(tab: ElementTabId): readonly FilterField[] {
  return tab === 'creatives' ? CREATIVE_FILTER_FIELDS : TEXT_FILTER_FIELDS
}

// Raw Meta-insight fields that can be pushed into the server query (re-fetch with
// a smaller upstream set). Everything else is a derived metric → client-side only.
// One source of truth for the query-vs-view filter split (see LibraryPane).
const SERVER_FILTER_FIELDS: ReadonlySet<FilterField> = new Set<FilterField>(['spend', 'impressions'])

export function isServerFilterField(field: FilterField): boolean {
  return SERVER_FILTER_FIELDS.has(field)
}

const CREATIVES_TAB: TabDef = {
  id: 'creatives',
  label: 'Creatives',
  sortFields: CREATIVE_SORT_FIELDS,
  defaultSort: 'spend',
  presets: CREATIVE_PRESETS,
}

const PRIMARY_TAB: TabDef = {
  id: 'primary',
  label: 'Primary Texts',
  sortFields: TEXT_SORT_FIELDS,
  defaultSort: 'roas',
  presets: TEXT_PRESETS,
}

const HEADLINE_TAB: TabDef = {
  id: 'headline',
  label: 'Headlines',
  sortFields: TEXT_SORT_FIELDS,
  defaultSort: 'ctr',
  presets: TEXT_PRESETS,
}

const URLS_SORT_FIELDS: readonly SortFieldDef[] = [
  SORT_ROAS,
  SORT_SPEND,
  SORT_PURCHASES,
  SORT_USED,
]

const URLS_TAB: TabDef = {
  id: 'urls',
  label: 'URLs',
  sortFields: URLS_SORT_FIELDS,
  defaultSort: 'spend',
  presets: TEXT_PRESETS,
}

export const ELEMENT_TABS: readonly TabDef[] = [CREATIVES_TAB, PRIMARY_TAB, HEADLINE_TAB, URLS_TAB]

export function getTabDef(id: ElementTabId): TabDef {
  return ELEMENT_TABS.find((t) => t.id === id) ?? CREATIVES_TAB
}

// Default to the last 7 days: recent enough to surface what's working now and a
// small ad set per fetch (the date dropdown can widen it). Matches the cheap
// "one cached fetch" model.
export const ELEMENT_LIBRARY_DATE_PRESET = 'last_7d'

export const INITIAL_VISIBLE = 20
export const VISIBLE_STEP = 20
