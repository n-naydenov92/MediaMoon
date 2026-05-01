'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Topbar from '@/components/layout/Topbar/Topbar'
import { findBrandById } from '@/config/brands'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'
import TabNavigation from '../../TabNavigation/TabNavigation'
import ActivePanel from '../ActivePanel/ActivePanel'
import styles from './DashboardChrome.module.css'

const MODULE_ICON = 'TrendingUp'

export default memo(function DashboardChrome(): JSX.Element {
  const { brandId, activeView } = useTrendingNewsContext()
  const brand = findBrandById(brandId)

  return (
    <>
      <Topbar
        title={LABELS.moduleName}
        iconName={MODULE_ICON}
        iconColor={brand?.color}
        subtitle={brand?.label ?? null}
      />
      <Box className={styles.contentWrapper}>
        <Stack spacing={6}>
          <TabNavigation />
          <ActivePanel activeView={activeView} />
        </Stack>
      </Box>
    </>
  )
})
