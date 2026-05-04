'use client'

import { useEffect, useMemo } from 'react'
import type { Market } from '@/types'
import type { BrandId } from '@/config/brands'
import { useMetaWindow } from '@/contexts/metaWindow/MetaWindowProvider'
import {
  DEFAULT_TOP_CRITERIA,
} from '@/lib/meta/aggregate'
import {
  previousPeriod,
  type DatePreset,
  type DateRangeSelection,
} from '@/lib/meta/dateRange'
import { sliceWindow, type OverviewSummary } from '@/lib/meta/sliceWindow'
import { ALL_MARKETS } from '@/lib/markets'

export type { OverviewSummary } from '@/lib/meta/sliceWindow'

export type OverviewState =
  | { readonly status: 'loading' }
  | { readonly status: 'no-token' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: OverviewSummary }

export interface OverviewControls {
  readonly state: OverviewState
  readonly refresh: () => void
}

interface OverviewQuery {
  readonly brandId: BrandId
  readonly market: Market | typeof ALL_MARKETS
  readonly datePreset: DatePreset
}

export function useOverviewData(query: OverviewQuery): OverviewControls {
  const { state: windowState, refresh, setKey } = useMetaWindow()

  useEffect(() => {
    setKey({ brandId: query.brandId, market: query.market })
  }, [query.brandId, query.market, setKey])

  const state = useMemo<OverviewState>(() => {
    if (windowState.status === 'idle' || windowState.status === 'loading') {
      return { status: 'loading' }
    }
    if (windowState.status === 'no-token') {
      return { status: 'no-token' }
    }
    if (windowState.status === 'error') {
      return { status: 'error', message: windowState.message }
    }
    const current: DateRangeSelection = { kind: 'preset', preset: query.datePreset }
    const previous = previousPeriod(current)
    const data = sliceWindow({
      window: windowState.window,
      criteria: DEFAULT_TOP_CRITERIA,
      current,
      previous,
    })
    return { status: 'success', data }
  }, [windowState, query.datePreset])

  return { state, refresh }
}
