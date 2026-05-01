'use client'

import { useCallback, useEffect, useReducer } from 'react'
import type { AsyncState, Market, NewsResult } from '@/types'
import { ALL_MARKETS } from '@/lib/markets'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import type { BrandTopicConfig } from '@/Section/trending-news/config'
import { fetchNews } from '@/Section/trending-news/api'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { buildInitialState, reducer } from '@/Section/trending-news/context/reducer'

export interface TrendingFetcher {
  readonly dataByKey: ReadonlyMap<string, AsyncState<NewsResult>>
  readonly refresh: () => Promise<void>
  readonly refreshAll: () => Promise<void>
  readonly ensureLoaded: (market: Market) => void
}

export function useTrendingFetcher(topic: BrandTopicConfig): TrendingFetcher {
  const { selectedMarket, markets } = useBrandShellContext()
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState)

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

  useEffect(() => {
    if (selectedMarket === ALL_MARKETS) {
      return
    }
    const key = cacheKey(topic.brandId, selectedMarket)
    if (state.dataByKey.has(key)) {
      return
    }
    void fetchFor(selectedMarket, false)
  }, [selectedMarket, state.dataByKey, fetchFor, topic.brandId])

  const refresh = useCallback(async (): Promise<void> => {
    if (selectedMarket === ALL_MARKETS) {
      await Promise.all(markets.map((m) => fetchFor(m, true)))
      return
    }
    await fetchFor(selectedMarket, true)
  }, [selectedMarket, markets, fetchFor])

  const refreshAll = useCallback(async (): Promise<void> => {
    await Promise.all(markets.map((m) => fetchFor(m, true)))
  }, [markets, fetchFor])

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

  return { dataByKey: state.dataByKey, refresh, refreshAll, ensureLoaded }
}
