'use client'

import { memo, useCallback } from 'react'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import RefreshOutlined from '@mui/icons-material/RefreshOutlined'
import { ALL_MARKETS } from '@/lib/markets'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { LABELS } from '@/Section/trending-news/labels'
import { isAnyLoading, pickActiveExpiry, pickLatestExpiry } from '@/Section/trending-news/helpers'
import { useCountdownString } from '@/Section/trending-news/hooks/useCountdownString'
import RefreshTooltip from './RefreshTooltip'
import styles from './RefreshButton.module.css'

export default memo(function RefreshButton(): JSX.Element {
  const { brandId, dataByKey, refresh, refreshAll } = useTrendingNewsContext()
  const { selectedMarket } = useBrandShellContext()

  const isOverview = selectedMarket === ALL_MARKETS
  const expiry = isOverview
    ? pickLatestExpiry(dataByKey)
    : pickActiveExpiry(dataByKey, brandId, selectedMarket)
  const isRefreshing = isOverview
    ? isAnyLoading(dataByKey)
    : dataByKey.get(cacheKey(brandId, selectedMarket))?.status === 'loading'
  const countdown = useCountdownString(expiry)

  const handleClick = useCallback((): void => {
    void (isOverview ? refreshAll() : refresh())
  }, [isOverview, refresh, refreshAll])

  return (
    <Tooltip title={<RefreshTooltip countdown={countdown} />} placement="bottom" arrow>
      <span>
        <IconButton
          size="small"
          onClick={handleClick}
          disabled={isRefreshing}
          aria-label={LABELS.refreshButton.aria}
        >
          <RefreshOutlined
            fontSize="small"
            className={isRefreshing ? styles.spinning : styles.icon}
          />
        </IconButton>
      </span>
    </Tooltip>
  )
})
