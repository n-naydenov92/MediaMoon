'use client'

import { memo } from 'react'
import type { UserRole } from '@/types'
import TrendingNewsProvider from '@/Section/trending-news/context/TrendingNewsProvider'
import DashboardChrome from './DashboardChrome/DashboardChrome'

interface Props {
  readonly role: UserRole
}

/**
 * Root entry point for the Trending News module — mounts the context provider and chrome.
 */
export default memo(function TrendingNewsDashboard({ role }: Props): JSX.Element {
  return (
    <TrendingNewsProvider role={role}>
      <DashboardChrome />
    </TrendingNewsProvider>
  )
})
