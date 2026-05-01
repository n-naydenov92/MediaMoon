'use client'

import { memo, type SyntheticEvent } from 'react'
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

/**
 * Horizontal tab strip for switching between Overview and the brand's market tabs.
 * The active indicator uses the brand color.
 */
export default memo(function TabNavigation(): JSX.Element {
  const { brandId, topic, activeView, setActiveView } = useTrendingNewsContext()
  const brand = findBrandById(brandId)
  const accent = brand?.color ?? 'primary.main'

  const handleChange = (_event: SyntheticEvent, value: ActiveView): void => {
    setActiveView(value)
  }

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
        sx={{
          '& .MuiTabs-indicator': { backgroundColor: accent, height: 3 },
          '& .MuiTab-root.Mui-selected': { color: accent },
        }}
      >
        <Tab value="overview" label={LABELS.tabs.overview} />
        {topic.markets.map((market) => (
          <Tab key={market} value={market} label={LABELS.markets[market]} />
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
