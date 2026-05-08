import { defaultCriteriaForPreset, type TopCriteria } from '@/lib/meta/aggregate'
import {
  CPLPV_GOOD_MAX,
  CPP_GOOD_MAX,
  CTR_GOOD_MIN,
  ROAS_GOOD_MIN,
} from '@/lib/meta/metricThresholds'
import type { LeaderboardSlice } from '../overview/performanceHref'
import type { FilterRule } from './filterRules'

export type SortDirection = 'asc' | 'desc'

export interface SortSpec {
  readonly field: string
  readonly direction: SortDirection
}

export const DEFAULT_SORT: SortSpec = { field: 'spend', direction: 'desc' }

export interface SlicePreset {
  readonly filters: readonly FilterRule[]
  readonly sort: SortSpec
}

export function sliceToFilters(
  slice: LeaderboardSlice | 'all' | null,
  criteria: TopCriteria,
): SlicePreset {
  if (slice === 'top-all') {
    return {
      filters: [
        { field: 'spend', operator: 'gt', value: criteria.minSpend },
        { field: 'roas', operator: 'gt', value: criteria.topMinRoas },
      ],
      sort: { field: 'roas', direction: 'desc' },
    }
  }
  if (slice === 'top-video') {
    return {
      filters: [
        { field: 'spend', operator: 'gt', value: criteria.minSpend },
        { field: 'roas', operator: 'gt', value: criteria.topMinRoas },
        { field: 'creativeType', operator: 'eq', value: 'video' },
      ],
      sort: { field: 'roas', direction: 'desc' },
    }
  }
  if (slice === 'top-image') {
    return {
      filters: [
        { field: 'spend', operator: 'gt', value: criteria.minSpend },
        { field: 'roas', operator: 'gt', value: criteria.topMinRoas },
        { field: 'creativeType', operator: 'eq', value: 'image' },
      ],
      sort: { field: 'roas', direction: 'desc' },
    }
  }
  if (slice === 'winners') {
    return {
      filters: [
        { field: 'roas', operator: 'gte', value: ROAS_GOOD_MIN },
        { field: 'cpp', operator: 'lte', value: CPP_GOOD_MAX },
        { field: 'ctr', operator: 'gte', value: CTR_GOOD_MIN },
        { field: 'cplpv', operator: 'lte', value: CPLPV_GOOD_MAX },
      ],
      sort: { field: 'roas', direction: 'desc' },
    }
  }
  if (slice === 'underperformers') {
    return {
      filters: [
        { field: 'spend', operator: 'gt', value: criteria.minSpend },
        { field: 'roas', operator: 'lt', value: criteria.underMaxRoas },
      ],
      sort: { field: 'roas', direction: 'asc' },
    }
  }
  return {
    filters: [{ field: 'spend', operator: 'gt', value: 0 }],
    sort: DEFAULT_SORT,
  }
}

export function defaultCriteriaFor(preset: string | null): TopCriteria {
  return defaultCriteriaForPreset(preset ?? '')
}

export function parseSortFromQuery(raw: string | null): SortSpec {
  if (!raw) {
    return DEFAULT_SORT
  }
  const [field, direction] = raw.split(':')
  if (!field || (direction !== 'asc' && direction !== 'desc')) {
    return DEFAULT_SORT
  }
  return { field, direction }
}

export function stringifySort(sort: SortSpec): string {
  return `${sort.field}:${sort.direction}`
}
