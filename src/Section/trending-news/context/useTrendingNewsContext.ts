'use client'

import { useContext } from 'react'
import { TrendingNewsContext, type TrendingNewsContextValue } from './trendingNewsCtx'

export function useTrendingNewsContext(): TrendingNewsContextValue {
  const ctx = useContext(TrendingNewsContext)
  if (!ctx) {
    throw new Error(
      'useTrendingNewsContext must be used within <TrendingNewsProvider>',
    )
  }
  return ctx
}
