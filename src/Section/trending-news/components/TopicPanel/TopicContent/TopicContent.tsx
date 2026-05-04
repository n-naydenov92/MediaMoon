'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import CenteredSpinner from '@/components/ui/CenteredSpinner/CenteredSpinner'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import ErrorPanel from '@/components/ui/ErrorPanel/ErrorPanel'
import type { AsyncState, NewsResult } from '@/types'
import { LABELS } from '@/Section/trending-news/labels'
import NewsBlock from '../../NewsBlock/NewsBlock'
import StatsRow from '../../StatsRow/StatsRow'
import RefreshButton from '../../RefreshButton/RefreshButton'
import SourceStatsPopover from '../../SourceStatsPopover/SourceStatsPopover'
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
      const actions = (
        <>
          <SourceStatsPopover />
          <RefreshButton />
        </>
      )
      if (state.data.clusters.length === 0) {
        return (
          <Stack spacing={6}>
            <StatsRow stats={state.data.stats} actions={actions} />
            <EmptyState
              title={LABELS.topicDashboard.emptyLast30d}
              description={LABELS.emptyState.retry}
            />
          </Stack>
        )
      }
      return (
        <Stack spacing={6}>
          <StatsRow stats={state.data.stats} actions={actions} />
          <Stack spacing={3}>
            {state.data.clusters.map((cluster, index) => (
              <NewsBlock
                key={`${cluster.market}-${cluster.representativeTitle}`}
                cluster={cluster}
                defaultExpanded={index === 0}
              />
            ))}
          </Stack>
        </Stack>
      )
    }
  }
})
