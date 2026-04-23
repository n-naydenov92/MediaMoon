'use client'

import { createContext } from 'react'
import type { AsyncState, Market, NewsResult, UserRole } from '@/types'

/**
 * Context definition — types and React context object only.
 * The Provider and the hook live in sibling files (Context Triad pattern).
 */

export interface TrendingNewsContextValue {
  readonly role: UserRole
  readonly activeTabId: string
  readonly activeMarket: Market
  readonly dataByKey: ReadonlyMap<string, AsyncState<NewsResult>>
  readonly setActiveTab: (tabId: string) => void
  readonly setActiveMarket: (market: Market) => void
  readonly refresh: () => Promise<void>
  readonly refreshAll: () => Promise<void>
  readonly ensureLoaded: (tabId: string, market: Market) => void
}

export const TrendingNewsContext = createContext<TrendingNewsContextValue | null>(null)

export function cacheKey(tabId: string, market: Market): string {
  return `${tabId}:${market}`
}
