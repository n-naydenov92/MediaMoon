'use client'

import { memo, useCallback, type SyntheticEvent } from 'react'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { findBrandById } from '@/config/brands'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import type { ActiveView } from '@/Section/trending-news/context/trendingNewsCtx'
import { LABELS } from '@/Section/trending-news/labels'
import KeywordsPopover from '../KeywordsBar/KeywordsBar'
import SourceStatsPopover from '../SourceStatsPopover/SourceStatsPopover'
import RefreshButton from '../RefreshButton/RefreshButton'
import styles from './TabNavigation.module.css'

const DEFAULT_ACCENT = '#6C63FF'

export default memo(function TabNavigation(): JSX.Element {
  const { brandId, topic, activeView, setActiveView } = useTrendingNewsContext()
  const brand = findBrandById(brandId)
  const accent = brand?.color ?? DEFAULT_ACCENT

  const handleChange = useCallback(
    (_event: SyntheticEvent, value: ActiveView): void => {
      setActiveView(value)
    },
    [setActiveView],
  )

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      className={styles.wrapper}
    >
      <Tabs
        value={activeView}
        onChange={handleChange}
        aria-label={LABELS.aria.tabs}
        className={styles.tabs}
        TabIndicatorProps={{ style: { backgroundColor: accent } }}
        textColor="inherit"
      >
        <Tab
          value="overview"
          label={LABELS.tabs.overview}
          style={activeView === 'overview' ? { color: accent } : undefined}
        />
        {topic.markets.map((market) => (
          <Tab
            key={market}
            value={market}
            label={LABELS.markets[market]}
            style={activeView === market ? { color: accent } : undefined}
          />
        ))}
      </Tabs>
      <Stack direction="row" spacing={1} alignItems="center">
        <KeywordsPopover />
        <SourceStatsPopover />
        <RefreshButton />
      </Stack>
    </Stack>
  )
})
