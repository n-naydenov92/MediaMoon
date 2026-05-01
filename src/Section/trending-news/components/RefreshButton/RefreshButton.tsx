'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import RefreshOutlined from '@mui/icons-material/RefreshOutlined'
import { LABELS as APP_LABELS } from '@/components/layout/labels'
import { formatRemaining } from '@/components/layout/Topbar/helpers'
import type { AsyncState, Market, NewsResult } from '@/types'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { LABELS } from '@/Section/trending-news/labels'
import { pickLatestExpiry } from '@/Section/trending-news/helpers'
import styles from './RefreshButton.module.css'

const COUNTDOWN_TICK_MS = 30_000

export default memo(function RefreshButton(): JSX.Element {
  const { brandId, activeView, dataByKey, refresh, refreshAll } = useTrendingNewsContext()

  const isOverview = activeView === 'overview'
  const expiry = isOverview
    ? pickLatestExpiry(dataByKey)
    : pickActiveExpiry(dataByKey, brandId, activeView)
  const isRefreshing = isOverview
    ? isAnyLoading(dataByKey)
    : dataByKey.get(cacheKey(brandId, activeView))?.status === 'loading'

  const [countdown, setCountdown] = useState<string>(() =>
    expiry ? formatRemaining(expiry) : '',
  )

  const handleClick = useCallback((): void => {
    void (isOverview ? refreshAll() : refresh())
  }, [isOverview, refresh, refreshAll])

  useEffect(() => {
    if (!expiry) {
      setCountdown('')
      return
    }
    setCountdown(formatRemaining(expiry))
    const timer = setInterval(() => {
      setCountdown(formatRemaining(expiry))
    }, COUNTDOWN_TICK_MS)
    return () => {
      clearInterval(timer)
    }
  }, [expiry])

  return (
    <Tooltip title={renderTooltip(countdown)} placement="bottom" arrow>
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

function pickActiveExpiry(
  states: ReadonlyMap<string, AsyncState<NewsResult>>,
  brandId: string,
  market: Market,
): string | null {
  const state = states.get(cacheKey(brandId, market))
  return state?.status === 'success' ? state.data.cacheExpiresAt : null
}

function isAnyLoading(states: ReadonlyMap<string, AsyncState<NewsResult>>): boolean {
  for (const state of states.values()) {
    if (state.status === 'loading') {
      return true
    }
  }
  return false
}

function renderTooltip(countdown: string): React.ReactNode {
  return (
    <Stack spacing={1} className={styles.tooltipBody}>
      <Typography variant="caption" className={styles.tooltipAction}>
        {LABELS.refreshButton.action}
      </Typography>
      {countdown && (
        <Typography variant="caption" className={styles.tooltipInfo}>
          {APP_LABELS.topbar.refreshesIn} {countdown}
        </Typography>
      )}
    </Stack>
  )
}
