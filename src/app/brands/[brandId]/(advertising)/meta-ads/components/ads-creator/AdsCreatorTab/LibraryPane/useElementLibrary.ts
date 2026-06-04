import { useCallback, useEffect, useRef, useState } from 'react'
import type { BrandId } from '@/config/brands'
import { ALL_MARKETS, type MarketSelection } from '@/lib/markets'
import type { DateRangeSelection } from '@/lib/meta/dateRange'
import { stringifyFilterRules, type FilterRule } from '@/lib/meta/filterRules'
import type { ElementsPayload } from './decompose'

const NO_TOKEN_STATUS = 503
export const ELEMENT_PAGE_SIZE = 200

export type ElementLibraryState =
  | { readonly status: 'loading' }
  | { readonly status: 'no-token' }
  | { readonly status: 'error'; readonly message: string }
  | { readonly status: 'success'; readonly data: ElementsPayload; readonly loadingMore: boolean }

export interface ElementLibraryControls {
  readonly state: ElementLibraryState
  readonly refresh: () => void
  readonly loadMore: () => void
}

interface ApiError {
  error?: string
}

// One page per (brand, market, date, server-filter) window, ranked by spend at the
// source. Switching tabs/view-filters never re-hits the network — only changing a
// server filter, the date, or "Load more" does. The Map cache shares the merged,
// accumulated pages across remounts; the route adds the shared edge cache on top.
export function useElementLibrary(
  brandId: BrandId,
  market: MarketSelection,
  dateSelection: DateRangeSelection,
  serverFilters: readonly FilterRule[],
): ElementLibraryControls {
  const cacheRef = useRef<Map<string, ElementsPayload>>(new Map())
  const [state, setState] = useState<ElementLibraryState>({ status: 'loading' })
  const [refreshTick, setRefreshTick] = useState(0)
  const stateRef = useRef<ElementLibraryState>(state)
  // eslint-disable-next-line react-hooks/refs -- read latest state inside loadMore without re-subscribing (same pattern as useAdsList)
  stateRef.current = state

  const baseSearch = buildBaseSearch(brandId, market, dateSelection, serverFilters)

  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = pageKey(baseSearch, 0)

    const cached = refreshTick === 0 ? cacheRef.current.get(cacheKey) : undefined
    if (cached) {
      setState({ status: 'success', data: cached, loadingMore: false })
      return () => controller.abort()
    }

    setState({ status: 'loading' })

    void (async () => {
      try {
        const response = await fetch(`/api/meta-ads/elements?${cacheKey}`, {
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
        const data = (await response.json()) as ElementsPayload
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
  }, [baseSearch, refreshTick])

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

    void (async () => {
      try {
        const response = await fetch(`/api/meta-ads/elements?${pageKey(baseSearch, nextOffset)}`)
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as ApiError
          setState({ status: 'error', message: body.error ?? `HTTP ${response.status}` })
          return
        }
        const data = (await response.json()) as ElementsPayload
        const previous = stateRef.current
        if (previous.status !== 'success') {
          return
        }
        const merged: ElementsPayload = {
          items: [...previous.data.items, ...data.items],
          nextOffset: data.nextOffset,
          fetchedAt: data.fetchedAt,
        }
        cacheRef.current.set(pageKey(baseSearch, 0), merged)
        setState({ status: 'success', loadingMore: false, data: merged })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
      }
    })()
  }, [baseSearch])

  return { state, refresh, loadMore }
}

function pageKey(baseSearch: string, offset: number): string {
  const params = new URLSearchParams(baseSearch)
  params.set('offset', String(offset))
  params.set('limit', String(ELEMENT_PAGE_SIZE))
  return params.toString()
}

function buildBaseSearch(
  brandId: BrandId,
  market: MarketSelection,
  dateSelection: DateRangeSelection,
  serverFilters: readonly FilterRule[],
): string {
  const params = new URLSearchParams({ brandId })
  if (market !== ALL_MARKETS) {
    params.set('market', market)
  }
  if (dateSelection.kind === 'preset') {
    params.set('datePreset', dateSelection.preset)
  } else {
    params.set('from', dateSelection.range.from)
    params.set('to', dateSelection.range.to)
  }
  if (serverFilters.length > 0) {
    params.set('filter', stringifyFilterRules(serverFilters))
  }
  return params.toString()
}
