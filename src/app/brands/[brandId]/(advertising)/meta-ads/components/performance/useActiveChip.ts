'use client'

import { useMemo } from 'react'
import type { TopCriteria } from '@/lib/meta/aggregate'
import { stringifyFilterRules, type FilterRule } from './filterRules'
import { sliceToFilters, stringifySort, type SortSpec } from './sliceToFilters'
import type { ChipKey } from './PerformanceTab/FilterChips/FilterChips'

const ALL_CHIPS: readonly ChipKey[] = [
  'all',
  'top-all',
  'top-video',
  'top-image',
  'winners',
  'underperformers',
]

export function useActiveChip(
  rules: readonly FilterRule[],
  sort: SortSpec,
  criteria: TopCriteria,
): ChipKey | null {
  return useMemo(() => {
    const currentRulesStr = stringifyFilterRules(rules)
    const currentSortStr = stringifySort(sort)
    for (const chip of ALL_CHIPS) {
      const preset = sliceToFilters(chip === 'all' ? null : chip, criteria)
      if (
        stringifyFilterRules(preset.filters) === currentRulesStr &&
        stringifySort(preset.sort) === currentSortStr
      ) {
        return chip
      }
    }
    return null
  }, [rules, sort, criteria])
}
