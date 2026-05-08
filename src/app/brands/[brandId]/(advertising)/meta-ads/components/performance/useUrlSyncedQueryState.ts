'use client'

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  DEFAULT_DATE_PRESET,
  parseDateRangeFromQuery,
  type DateRangeSelection,
} from '@/lib/meta/dateRange'
import type { LeaderboardSlice } from '../overview/performanceHref'
import {
  parseFilterRules,
  stringifyFilterRules,
  type FilterRule,
} from './filterRules'
import {
  DEFAULT_SORT,
  defaultCriteriaFor,
  parseSortFromQuery,
  sliceToFilters,
  stringifySort,
  type SortSpec,
} from './sliceToFilters'

interface UrlState {
  readonly dateSelection: DateRangeSelection
  readonly rules: readonly FilterRule[]
  readonly sort: SortSpec
}

export interface UrlSyncedQueryState extends UrlState {
  readonly setDateSelection: Dispatch<SetStateAction<DateRangeSelection>>
  readonly setRules: Dispatch<SetStateAction<readonly FilterRule[]>>
  readonly setSort: Dispatch<SetStateAction<SortSpec>>
}

function isLeaderboardSlice(value: string): value is LeaderboardSlice {
  return (
    value === 'top-all' ||
    value === 'top-video' ||
    value === 'top-image' ||
    value === 'winners' ||
    value === 'underperformers'
  )
}

function parseFromParams(params: URLSearchParams): UrlState {
  const dateSelection = parseDateRangeFromQuery(params)
  const presetForCriteria = dateSelection.kind === 'preset' ? dateSelection.preset : null
  const criteria = defaultCriteriaFor(presetForCriteria)
  const sliceParam = params.get('slice')
  const filterParam = params.get('filter')
  const sortParam = params.get('sort')
  if (!filterParam && !sortParam && sliceParam && isLeaderboardSlice(sliceParam)) {
    const preset = sliceToFilters(sliceParam, criteria)
    return { dateSelection, rules: preset.filters, sort: preset.sort }
  }
  return {
    dateSelection,
    rules: parseFilterRules(filterParam),
    sort: parseSortFromQuery(sortParam),
  }
}

function buildSearchString(state: UrlState): string {
  const parts: string[] = []
  if (state.dateSelection.kind === 'preset') {
    if (state.dateSelection.preset !== DEFAULT_DATE_PRESET) {
      parts.push(`datePreset=${state.dateSelection.preset}`)
    }
  } else {
    parts.push(`from=${state.dateSelection.range.from}`)
    parts.push(`to=${state.dateSelection.range.to}`)
  }
  if (state.rules.length > 0) {
    parts.push(`filter=${stringifyFilterRules(state.rules)}`)
  }
  const sortStr = stringifySort(state.sort)
  if (sortStr !== stringifySort(DEFAULT_SORT)) {
    parts.push(`sort=${sortStr}`)
  }
  return parts.join('&')
}

export function useUrlSyncedQueryState(): UrlSyncedQueryState {
  const pathname = usePathname()
  const initialSearchParams = useSearchParams()

  const [dateSelection, setDateSelection] = useState<DateRangeSelection>(
    () => parseFromParams(initialSearchParams).dateSelection,
  )
  const [rules, setRules] = useState<readonly FilterRule[]>(
    () => parseFromParams(initialSearchParams).rules,
  )
  const [sort, setSort] = useState<SortSpec>(
    () => parseFromParams(initialSearchParams).sort,
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    const search = buildSearchString({ dateSelection, rules, sort })
    const newUrl = search ? `${pathname}?${search}` : pathname
    const currentUrl = `${window.location.pathname}${window.location.search}`
    if (newUrl !== currentUrl) {
      window.history.replaceState(window.history.state, '', newUrl)
    }
  }, [dateSelection, rules, sort, pathname])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    function handler(): void {
      const params = new URLSearchParams(window.location.search)
      const next = parseFromParams(params)
      setDateSelection(next.dateSelection)
      setRules(next.rules)
      setSort(next.sort)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  return { dateSelection, rules, sort, setDateSelection, setRules, setSort }
}
