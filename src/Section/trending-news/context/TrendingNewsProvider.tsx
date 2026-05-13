'use client'

import { memo, useMemo, type ReactNode } from 'react'
import { findBrandTopic } from '@/Section/trending-news/config'
import { useTrendingFetcher } from '@/Section/trending-news/hooks/useTrendingFetcher'
import { TrendingNewsContext } from './trendingNewsCtx'

interface Props {
  readonly brandId: string
  readonly children: ReactNode
}

export default memo(function TrendingNewsProvider({ brandId, children }: Props): JSX.Element {
  const topic = useMemo(() => findBrandTopic(brandId), [brandId])
  if (!topic) {
    throw new Error(`No trending-news topic configured for brand: ${brandId}`)
  }

  const fetcher = useTrendingFetcher(topic)

  const value = useMemo(
    () => ({ brandId: topic.brandId, topic, ...fetcher }),
    [topic, fetcher],
  )

  return <TrendingNewsContext.Provider value={value}>{children}</TrendingNewsContext.Provider>
})
