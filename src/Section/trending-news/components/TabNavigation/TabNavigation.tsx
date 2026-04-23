'use client'

import { memo, type SyntheticEvent } from 'react'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { getTabsForRole } from '@/Section/trending-news/config'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'

/**
 * Role-filtered horizontal tab strip for switching between trending-news topics.
 */
export default memo(function TabNavigation(): JSX.Element {
  const { role, activeTabId, setActiveTab } = useTrendingNewsContext()
  const tabs = getTabsForRole(role)

  const handleChange = (_event: SyntheticEvent, value: string): void => {
    setActiveTab(value)
  }

  return (
    <Tabs
      value={activeTabId}
      onChange={handleChange}
      aria-label={LABELS.aria.tabs}
      variant="standard"
    >
      {tabs.map((tab) => (
        <Tab key={tab.id} value={tab.id} label={tab.label} />
      ))}
    </Tabs>
  )
})
