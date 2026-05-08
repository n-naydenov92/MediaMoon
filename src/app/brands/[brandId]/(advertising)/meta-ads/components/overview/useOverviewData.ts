import { useCallback, useEffect, useRef, useState } from 'react'
import type { Market } from '@/types'
import type { BrandId } from '@/config/brands'
import type {
  AccountSummary,
  AdLeaderboardEntry,
  DailyPoint,
  KpiDelta,
  TopCriteria,
} from '@/lib/meta/aggregate'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import { ALL_MARKETS } from '@/lib/markets'

const NO_TOKEN_STATUS = 503

export interface OverviewSummary {
  readonly kpis: KpiDelta
  readonly byDay: readonly DailyPoint[]
  readonly byAccount: readonly AccountSummary[]
  readonly topAll: readonly AdLeaderboardEntry[]
  readonly topVideos: readonly AdLeaderboardEntry[]
  readonly topImages: readonly AdLeaderboardEntry[]
  readonly underperformers: readonly AdLeaderboardEntry[]
  readonly criteria: TopCriteria
  readonly fetchedAt: number
}

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
  readonly dateSelection: DateRangeSelection
}

interface ApiError {
  error?: string
}

export function useOverviewData(query: OverviewQuery): OverviewControls {
  const [state, setState] = useState<OverviewState>({ status: 'loading' })
  const [refreshTick, setRefreshTick] = useState(0)
  const cacheRef = useRef<Map<string, OverviewSummary>>(new Map())

  const dateKey =
    query.dateSelection.kind === 'preset'
      ? `p:${query.dateSelection.preset}`
      : `c:${query.dateSelection.range.from}:${query.dateSelection.range.to}`

  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = `${query.brandId}|${query.market}|${dateKey}`
    const cached = refreshTick === 0 ? cacheRef.current.get(cacheKey) : undefined
    if (cached) {
      setState({ status: 'success', data: cached })
    } else {
      setState({ status: 'loading' })
    }

    const search = new URLSearchParams({ brandId: query.brandId })
    if (query.dateSelection.kind === 'preset') {
      search.set('datePreset', query.dateSelection.preset)
    } else {
      search.set('from', query.dateSelection.range.from)
      search.set('to', query.dateSelection.range.to)
    }
    if (query.market !== ALL_MARKETS) {
      search.set('market', query.market)
    }

    void (async () => {
      try {
        const response = await fetch(`/api/meta-ads/summary?${search.toString()}`, {
          signal: controller.signal,
          cache: refreshTick > 0 ? 'reload' : 'default',
        })
        if (response.status === NO_TOKEN_STATUS) {
          setState({ status: 'no-token' })
          return
        }
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as ApiError
          setState({ status: 'error', message: body.error ?? `HTTP ${response.status}` })
          return
        }
        const data = (await response.json()) as OverviewSummary
        cacheRef.current.set(cacheKey, data)
        setState({ status: 'success', data })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
      }
    })()

    return () => controller.abort()
  }, [query.brandId, query.market, query.dateSelection, dateKey, refreshTick])

  const refresh = useCallback((): void => {
    setRefreshTick((n) => n + 1)
  }, [])

  return { state, refresh }
}
