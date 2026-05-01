'use client'

import { createContext } from 'react'
import type { AsyncState, Market, NewsResult } from '@/types'
import type { BrandTopicConfig } from '@/Section/trending-news/config'

/**
 * Context definition — types and React context object only.
 * The Provider and the hook live in sibling files (Context Triad pattern).
 */

export interface TrendingNewsContextValue {
  readonly brandId: string
  readonly topic: BrandTopicConfig
  readonly dataByKey: ReadonlyMap<string, AsyncState<NewsResult>>
  readonly refresh: () => Promise<void>
  readonly refreshAll: () => Promise<void>
  readonly ensureLoaded: (market: Market) => void
}

export const TrendingNewsContext = createContext<TrendingNewsContextValue | null>(null)

export function cacheKey(brandId: string, market: Market): string {
  return `${brandId}:${market}`
}
