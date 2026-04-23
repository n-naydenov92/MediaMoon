'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import CenteredSpinner from '@/components/ui/CenteredSpinner/CenteredSpinner'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import ErrorPanel from '@/components/ui/ErrorPanel/ErrorPanel'
import type { AsyncState, NewsResult } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import NewsBlock from '../../NewsBlock/NewsBlock'
import SourceDebugRow from '../../SourceDebugRow/SourceDebugRow'
import StatsRow from '../../StatsRow/StatsRow'
import LoadingSkeleton from '../LoadingSkeleton/LoadingSkeleton'

interface Props {
  readonly state: AsyncState<NewsResult>
  readonly onRetry: () => void | Promise<void>
}

/**
 * Renders the correct UI for each async state of a topic tab's news data.
 */
export default memo(function TopicContent({ state, onRetry }: Props): JSX.Element {
  switch (state.status) {
    case 'idle':
      return <CenteredSpinner label={LABELS.topicPanel.preparing} />
    case 'loading':
      return <LoadingSkeleton />
    case 'error':
      return (
        <ErrorPanel
          title={LABELS.errorPanel.loadError}
          message={state.message}
          onRetry={() => {
            void onRetry()
          }}
        />
      )
    case 'success': {
      if (state.data.clusters.length === 0) {
        return (
          <EmptyState
            title={LABELS.topicDashboard.emptyLast30d}
            description={LABELS.emptyState.retry}
          />
        )
      }
      return (
        <Stack spacing={6}>
          <SourceDebugRow
            sourceCounts={state.data.sourceCounts}
            sourceErrors={state.data.sourceErrors}
          />
          <StatsRow stats={state.data.stats} />
          <Stack spacing={4}>
            {state.data.clusters.map((cluster) => (
              <NewsBlock
                key={`${cluster.market}-${cluster.representativeTitle}`}
                cluster={cluster}
              />
            ))}
          </Stack>
        </Stack>
      )
    }
  }
})
