'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { ALL_MARKETS } from '@/lib/markets'
import { MARKET_LABELS } from '@/lib/marketLabels'
import { PageHeader, type Crumb } from '@/components/layout/PageHeader'
import TrendingNewsUpdatedBadge from '../../TrendingNewsUpdatedBadge/TrendingNewsUpdatedBadge'
import ActivePanel from '../ActivePanel/ActivePanel'
import styles from './DashboardChrome.module.css'

export default memo(function DashboardChrome(): JSX.Element {
  const { selectedMarket } = useBrandShellContext()

  const crumbs = useMemo<readonly Crumb[]>(() => {
    const secondLabel =
      selectedMarket === ALL_MARKETS ? 'Overview' : MARKET_LABELS[selectedMarket]
    return [{ label: 'Trending News' }, { label: secondLabel }]
  }, [selectedMarket])

  return (
    <Box className={styles.contentWrapper}>
      <PageHeader crumbs={crumbs} actions={<TrendingNewsUpdatedBadge />} />
      <Stack spacing={6}>
        <ActivePanel selectedMarket={selectedMarket} />
      </Stack>
    </Box>
  )
})
