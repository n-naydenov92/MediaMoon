'use client'

import { memo, useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { AsyncState, Market, NewsResult } from '@/types'
import { findBrandTopic, type BrandTopicConfig } from '@/Section/trending-news/config'
import { TrendingNewsContext, cacheKey, type ActiveView } from './trendingNewsCtx'

// ─── State & Reducer ────────────────────────────────────────────────────────

interface State {
  readonly activeView: ActiveView
  readonly dataByKey: ReadonlyMap<string, AsyncState<NewsResult>>
}

type Action =
  | { type: 'SET_ACTIVE_VIEW'; view: ActiveView }
  | { type: 'FETCH_START'; key: string }
  | { type: 'FETCH_SUCCESS'; key: string; data: NewsResult }
  | { type: 'FETCH_ERROR'; key: string; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view }
    case 'FETCH_START':
      return { ...state, dataByKey: setKey(state.dataByKey, action.key, { status: 'loading' }) }
    case 'FETCH_SUCCESS':
      return {
        ...state,
        dataByKey: setKey(state.dataByKey, action.key, { status: 'success', data: action.data }),
      }
    case 'FETCH_ERROR':
      return {
        ...state,
        dataByKey: setKey(state.dataByKey, action.key, {
          status: 'error',
          message: action.message,
        }),
      }
  }
}

function setKey(
  source: ReadonlyMap<string, AsyncState<NewsResult>>,
  key: string,
  value: AsyncState<NewsResult>,
): ReadonlyMap<string, AsyncState<NewsResult>> {
  const next = new Map(source)
  next.set(key, value)
  return next
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface Props {
  readonly brandId: string
  readonly children: ReactNode
}

export default memo(function TrendingNewsProvider({ brandId, children }: Props): JSX.Element {
  const topic = useMemo(() => findBrandTopic(brandId), [brandId])
  if (!topic) {
    throw new Error(`No trending-news topic configured for brand: ${brandId}`)
  }

  const [state, dispatch] = useReducer(reducer, undefined, () => buildInitialState(topic))

  // Reset active view when brand changes
  useEffect(() => {
    dispatch({ type: 'SET_ACTIVE_VIEW', view: 'overview' })
  }, [brandId])

  const setActiveView = useCallback((view: ActiveView) => {
    dispatch({ type: 'SET_ACTIVE_VIEW', view })
  }, [])

  const fetchFor = useCallback(
    async (market: Market, force: boolean): Promise<void> => {
      const key = cacheKey(topic.brandId, market)
      dispatch({ type: 'FETCH_START', key })
      try {
        const data = await fetchNews({ brandId: topic.brandId, market, force })
        dispatch({ type: 'FETCH_SUCCESS', key, data })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        dispatch({ type: 'FETCH_ERROR', key, message })
      }
    },
    [topic.brandId],
  )

  // Auto-fetch when a market view becomes active
  useEffect(() => {
    if (state.activeView === 'overview') {
      return
    }
    const key = cacheKey(topic.brandId, state.activeView)
    if (state.dataByKey.has(key)) {
      return
    }
    void fetchFor(state.activeView, false)
  }, [state.activeView, state.dataByKey, fetchFor, topic.brandId])

  const refresh = useCallback(async (): Promise<void> => {
    if (state.activeView === 'overview') {
      await Promise.all(topic.markets.map((m) => fetchFor(m, true)))
      return
    }
    await fetchFor(state.activeView, true)
  }, [state.activeView, topic.markets, fetchFor])

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all(topic.markets.map((m) => fetchFor(m, true)))
  }, [topic.markets, fetchFor])

  const ensureLoaded = useCallback(
    (market: Market): void => {
      const key = cacheKey(topic.brandId, market)
      if (state.dataByKey.has(key)) {
        return
      }
      void fetchFor(market, false)
    },
    [state.dataByKey, fetchFor, topic.brandId],
  )

  const value = useMemo(
    () => ({
      brandId: topic.brandId,
      topic,
      activeView: state.activeView,
      dataByKey: state.dataByKey,
      setActiveView,
      refresh,
      refreshAll,
      ensureLoaded,
    }),
    [topic, state, setActiveView, refresh, refreshAll, ensureLoaded],
  )

  return <TrendingNewsContext.Provider value={value}>{children}</TrendingNewsContext.Provider>
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInitialState(_topic: BrandTopicConfig): State {
  return { activeView: 'overview', dataByKey: new Map() }
}

async function fetchNews(params: {
  readonly brandId: string
  readonly market: Market
  readonly force: boolean
}): Promise<NewsResult> {
  const { brandId, market, force } = params
  if (force) {
    const res = await fetch('/api/modules/trending-news/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brandId, market }),
    })
    return handleResponse(res)
  }
  const url = `/api/modules/trending-news?brandId=${encodeURIComponent(brandId)}&market=${market}`
  const res = await fetch(url)
  return handleResponse(res)
}

async function handleResponse(res: Response): Promise<NewsResult> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as NewsResult
}
