import { useCallback, useEffect, useRef, useState } from 'react'
import type { Market } from '@/types'
import type { BrandId } from '@/config/brands'
import { ALL_MARKETS } from '@/lib/markets'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import type { AdRow } from './columnSpecs'
import { stringifyFilterRules, type FilterRule } from './filterRules'
import { stringifySort, type SortSpec } from './sliceToFilters'

const NO_TOKEN_STATUS = 503

export interface AdsPage {
  readonly items: readonly AdRow[]
  readonly total: number
  readonly nextOffset: number | null
  readonly fetchedAt: number
}

export type AdsListState =
  | { readonly status: 'loading' }
  | { readonly status: 'no-token' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: AdsPage; readonly loadingMore: boolean }

export interface AdsListControls {
  readonly state: AdsListState
  readonly refresh: () => void
  readonly loadMore: () => void
}

export interface AdsListQuery {
  readonly brandId: BrandId
  readonly market: Market | typeof ALL_MARKETS
  readonly dateSelection: DateRangeSelection
  readonly filters: readonly FilterRule[]
  readonly sort: SortSpec
  readonly pageSize: number
}

interface ApiError {
  error?: string
}

const PAGE_SIZE = 50

export function useAdsList(query: AdsListQuery): AdsListControls {
  const cacheRef = useRef<Map<string, AdsPage>>(new Map())
  const [state, setState] = useState<AdsListState>({ status: 'loading' })
  const [refreshTick, setRefreshTick] = useState(0)
  const stateRef = useRef<AdsListState>(state)
  // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
  stateRef.current = state

  const queryKey = buildQueryKey(query)
  const baseSearch = buildBaseSearch(query)

  useEffect(() => {
    const controller = new AbortController()

    const search = new URLSearchParams(baseSearch)
    search.set('offset', '0')
    search.set('limit', String(query.pageSize))
    const cacheKey = search.toString()

    const cached = refreshTick === 0 ? cacheRef.current.get(cacheKey) : undefined
    if (cached) {
      setState({ status: 'success', data: cached, loadingMore: false })
      return () => controller.abort()
    }

    setState({ status: 'loading' })

    void (async () => {
      try {
        const response = await fetch(`/api/meta-ads/ads?${cacheKey}`, {
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
        const data = (await response.json()) as AdsPage
        cacheRef.current.set(cacheKey, data)
        setState({ status: 'success', data, loadingMore: false })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
      }
    })()

    return () => controller.abort()
  }, [queryKey, refreshTick, baseSearch, query.pageSize])

  const refresh = useCallback((): void => {
    cacheRef.current.clear()
    setRefreshTick((n) => n + 1)
  }, [])

  const loadMore = useCallback((): void => {
    const { current } = stateRef
    if (current.status !== 'success' || current.loadingMore || current.data.nextOffset === null) {
      return
    }
    const { nextOffset } = current.data
    setState({ ...current, loadingMore: true })

    const search = new URLSearchParams(baseSearch)
    search.set('offset', String(nextOffset))
    search.set('limit', String(query.pageSize))

    void (async () => {
      try {
        const response = await fetch(`/api/meta-ads/ads?${search.toString()}`)
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as ApiError
          setState({ status: 'error', message: body.error ?? `HTTP ${response.status}` })
          return
        }
        const data = (await response.json()) as AdsPage
        const previous = stateRef.current
        if (previous.status !== 'success') {
          return
        }
        const merged: AdsPage = {
          items: [...previous.data.items, ...data.items],
          total: data.total,
          nextOffset: data.nextOffset,
          fetchedAt: data.fetchedAt,
        }
        const firstPageSearch = new URLSearchParams(baseSearch)
        firstPageSearch.set('offset', '0')
        firstPageSearch.set('limit', String(query.pageSize))
        cacheRef.current.set(firstPageSearch.toString(), merged)
        setState({ status: 'success', loadingMore: false, data: merged })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
      }
    })()
  }, [baseSearch, query.pageSize])

  return { state, refresh, loadMore }
}

function buildBaseSearch(query: AdsListQuery): string {
  const params = new URLSearchParams({ brandId: query.brandId })
  if (query.market !== ALL_MARKETS) {
    params.set('market', query.market)
  }
  if (query.dateSelection.kind === 'preset') {
    params.set('datePreset', query.dateSelection.preset)
  } else {
    params.set('from', query.dateSelection.range.from)
    params.set('to', query.dateSelection.range.to)
  }
  if (query.filters.length > 0) {
    params.set('filter', stringifyFilterRules(query.filters))
  }
  params.set('sort', stringifySort(query.sort))
  return params.toString()
}

function buildQueryKey(query: AdsListQuery): string {
  return [
    query.brandId,
    query.market,
    query.dateSelection.kind === 'preset'
      ? `p:${query.dateSelection.preset}`
      : `c:${query.dateSelection.range.from}:${query.dateSelection.range.to}`,
    stringifyFilterRules(query.filters),
    stringifySort(query.sort),
    String(query.pageSize),
  ].join('|')
}

export const PERFORMANCE_PAGE_SIZE = PAGE_SIZE
