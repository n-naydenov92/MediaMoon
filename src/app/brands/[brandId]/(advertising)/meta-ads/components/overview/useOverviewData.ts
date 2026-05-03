import { useEffect, useState } from 'react'
import type { Market } from '@/types'
import type { BrandId } from '@/config/brands'
import type {
  AccountSummary,
  AdLeaderboardEntry,
  DailyPoint,
  KpiDelta,
  TopCriteria,
} from '@/lib/meta/aggregate'
import type { DatePreset } from '@/lib/meta/dateRange'
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
}

export type OverviewState =
  | { readonly status: 'loading' }
  | { readonly status: 'no-token' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: OverviewSummary }

interface OverviewQuery {
  readonly brandId: BrandId
  readonly market: Market | typeof ALL_MARKETS
  readonly datePreset: DatePreset
}

interface ApiError {
  error?: string
}

export function useOverviewData(query: OverviewQuery): OverviewState {
  const [state, setState] = useState<OverviewState>({ status: 'loading' })

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    const search = new URLSearchParams({ brandId: query.brandId, datePreset: query.datePreset })
    if (query.market !== ALL_MARKETS) {
      search.set('market', query.market)
    }

    void (async () => {
      try {
        const response = await fetch(`/api/meta-ads/summary?${search.toString()}`, {
          signal: controller.signal,
          cache: 'no-store',
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
  }, [query.brandId, query.market, query.datePreset])

  return state
}
