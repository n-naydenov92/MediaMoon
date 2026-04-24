'use client'

import { memo, useCallback, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { AsyncState, Market, NewsResult, UserRole } from '@/types'
import {
  findTabById,
  getTabsForRole,
  getTopicTabs,
  isTopicTab,
  type TopicTabConfig,
} from '@/Section/trending-news/config'
import { TrendingNewsContext, cacheKey } from './trendingNewsCtx'

// ─── State & Reducer (discriminated union actions) ───────────────────────────

interface State {
  readonly activeTabId: string
  readonly activeMarket: Market
  readonly dataByKey: ReadonlyMap<string, AsyncState<NewsResult>>
}

type Action =
  | { type: 'SET_ACTIVE_TAB'; tabId: string; fallbackMarket: Market }
  | { type: 'SET_ACTIVE_MARKET'; market: Market }
  | { type: 'FETCH_START'; key: string }
  | { type: 'FETCH_SUCCESS'; key: string; data: NewsResult }
  | { type: 'FETCH_ERROR'; key: string; message: string }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTabId: action.tabId, activeMarket: action.fallbackMarket }
    case 'SET_ACTIVE_MARKET':
      return { ...state, activeMarket: action.market }
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
  readonly role: UserRole
  readonly children: ReactNode
}

/**
 * Provides trending-news async state, cache, and tab/market controls to the subtree.
 */
export default memo(function TrendingNewsProvider({ role, children }: Props): JSX.Element {
  const initial = useMemo(() => buildInitialState(role), [role])
  const [state, dispatch] = useReducer(reducer, initial)

  const setActiveTab = useCallback(
    (tabId: string) => {
      const tab = findTabById(tabId)
      const fallbackMarket = pickDefaultMarket(tab)
      dispatch({ type: 'SET_ACTIVE_TAB', tabId, fallbackMarket })
    },
    [],
  )

  const setActiveMarket = useCallback((market: Market) => {
    dispatch({ type: 'SET_ACTIVE_MARKET', market })
  }, [])

  const fetchFor = useCallback(
    async (tabId: string, market: Market, force: boolean): Promise<void> => {
      const key = cacheKey(tabId, market)
      dispatch({ type: 'FETCH_START', key })
      try {
        const data = await fetchNews({ tabId, market, force })
        dispatch({ type: 'FETCH_SUCCESS', key, data })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        dispatch({ type: 'FETCH_ERROR', key, message })
      }
    },
    [],
  )

  useEffect(() => {
    const tab = findTabById(state.activeTabId)
    if (!tab || !isTopicTab(tab)) {
      return
    }
    const key = cacheKey(state.activeTabId, state.activeMarket)
    if (state.dataByKey.has(key)) {
      return
    }
    void fetchFor(state.activeTabId, state.activeMarket, false)
  }, [state.activeTabId, state.activeMarket, fetchFor, state.dataByKey])

  const refresh = useCallback(async (): Promise<void> => {
    const tab = findTabById(state.activeTabId)
    if (!tab || !isTopicTab(tab)) {
      return
    }
    await fetchFor(state.activeTabId, state.activeMarket, true)
  }, [state.activeTabId, state.activeMarket, fetchFor])

  const refreshAll = useCallback(async (): Promise<void> => {
    const combinations: { tabId: string; market: Market }[] = []
    for (const tab of getTopicTabs()) {
      for (const market of tab.markets) {
        combinations.push({ tabId: tab.id, market })
      }
    }
    await Promise.all(combinations.map((c) => fetchFor(c.tabId, c.market, true)))
  }, [fetchFor])

  const ensureLoaded = useCallback(
    (tabId: string, market: Market): void => {
      const key = cacheKey(tabId, market)
      if (state.dataByKey.has(key)) {
        return
      }
      void fetchFor(tabId, market, false)
    },
    [state.dataByKey, fetchFor],
  )

  const value = useMemo(
    () => ({
      role,
      activeTabId: state.activeTabId,
      activeMarket: state.activeMarket,
      dataByKey: state.dataByKey,
      setActiveTab,
      setActiveMarket,
      refresh,
      refreshAll,
      ensureLoaded,
    }),
    [role, state, setActiveTab, setActiveMarket, refresh, refreshAll, ensureLoaded],
  )

  return <TrendingNewsContext.Provider value={value}>{children}</TrendingNewsContext.Provider>
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildInitialState(role: UserRole): State {
  const tabs = getTabsForRole(role)
  const [firstTab] = tabs
  const activeTabId = firstTab?.id ?? ''
  const activeMarket = pickDefaultMarket(firstTab ?? null)
  return { activeTabId, activeMarket, dataByKey: new Map() }
}

function pickDefaultMarket(tab: ReturnType<typeof findTabById> | null): Market {
  if (tab && isTopicTab(tab)) {
    return (tab as TopicTabConfig).markets[0] ?? 'BG'
  }
  return 'BG'
}

async function fetchNews(params: {
  readonly tabId: string
  readonly market: Market
  readonly force: boolean
}): Promise<NewsResult> {
  const { tabId, market, force } = params
  if (force) {
    const res = await fetch('/api/modules/trending-news/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ tabId, market }),
    })
    return handleResponse(res)
  }
  const url = `/api/modules/trending-news?tabId=${encodeURIComponent(tabId)}&market=${market}`
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
