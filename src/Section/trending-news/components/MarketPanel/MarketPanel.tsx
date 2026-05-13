'use client'

import { memo } from 'react'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import type { AsyncState, Market, NewsResult } from '@/types'
import TopicContent from './TopicContent/TopicContent'

interface Props {
  readonly market: Market
}

/**
 * Renders news content for a single market of the active brand's topic.
 */
export default memo(function MarketPanel({ market }: Props): JSX.Element {
  const { brandId, dataByKey, refresh } = useTrendingNewsContext()
  const state: AsyncState<NewsResult> =
    dataByKey.get(cacheKey(brandId, market)) ?? { status: 'idle' }

  return <TopicContent state={state} onRetry={refresh} />
})
