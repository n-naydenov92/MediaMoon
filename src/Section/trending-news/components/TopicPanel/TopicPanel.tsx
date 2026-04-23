'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import type { TopicTabConfig } from '@/Section/trending-news/config'
import type { AsyncState, NewsResult } from '@/types'
import MarketFilter from '../MarketFilter/MarketFilter'
import TopicContent from './TopicContent/TopicContent'

interface Props {
  readonly tab: TopicTabConfig
}

/**
 * Panel for a single topic tab — shows the market filter and the current async news state.
 */
export default memo(function TopicPanel({ tab }: Props): JSX.Element {
  const { activeMarket, setActiveMarket, dataByKey, refresh } = useTrendingNewsContext()
  const state: AsyncState<NewsResult> =
    dataByKey.get(cacheKey(tab.id, activeMarket)) ?? { status: 'idle' }

  return (
    <Stack spacing={6}>
      <MarketFilter markets={tab.markets} active={activeMarket} onChange={setActiveMarket} />
      <TopicContent state={state} onRetry={refresh} />
    </Stack>
  )
})
