'use client'

import { memo } from 'react'
import ErrorPanel from '@/components/ui/ErrorPanel/ErrorPanel'
import { isOverviewTab, isTopicTab, type TabConfig } from '@/Section/trending-news/config'
import { LABELS } from '@/Section/trending-news/labels'
import OverviewDashboard from '../../OverviewDashboard/OverviewDashboard'
import TopicPanel from '../../TopicPanel/TopicPanel'

interface Props {
  readonly tab: TabConfig | null
  readonly tabId: string
}

/**
 * Renders the correct panel based on the active tab kind — overview, topic, or error state.
 */
export default memo(function ActivePanel({ tab, tabId }: Props): JSX.Element {
  if (!tab) {
    return (
      <ErrorPanel
        title={LABELS.errorPanel.noTabSelected}
        message={LABELS.errorPanel.noTabMessage}
      />
    )
  }
  if (isOverviewTab(tab)) {
    return <OverviewDashboard />
  }
  if (isTopicTab(tab)) {
    return <TopicPanel tab={tab} />
  }
  return (
    <ErrorPanel
      title={LABELS.errorPanel.unknownTab}
      message={LABELS.errorPanel.unsupportedTab(tabId)}
    />
  )
})
