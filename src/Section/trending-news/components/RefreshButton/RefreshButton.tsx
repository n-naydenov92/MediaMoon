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

const COUNTDOWN_TICK_MS = 30_000
const SPIN_DURATION_MS = 800

export default memo(function RefreshButton(): JSX.Element {
  const { brandId, activeView, dataByKey, refresh, refreshAll } = useTrendingNewsContext()
  const isOverview = activeView === 'overview'

  const expiry = isOverview
    ? pickLatestExpiry(dataByKey)
    : pickActiveExpiry(dataByKey, brandId, activeView)

  const isRefreshing = isOverview
    ? [...dataByKey.values()].some((s) => s.status === 'loading')
    : dataByKey.get(cacheKey(brandId, activeView))?.status === 'loading'

  const [countdown, setCountdown] = useState<string>(() =>
    expiry ? formatRemaining(expiry) : '',
  )

  useEffect(() => {
    if (!expiry) {
      setCountdown('')
      return
    }
    setCountdown(formatRemaining(expiry))
    const timer = setInterval(() => {
      setCountdown(formatRemaining(expiry))
    }, COUNTDOWN_TICK_MS)
    return () => clearInterval(timer)
  }, [expiry])

  const handleClick = useCallback((): void => {
    void (isOverview ? refreshAll() : refresh())
  }, [isOverview, refresh, refreshAll])

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
            sx={{
              animation: isRefreshing
                ? `tn-spin ${SPIN_DURATION_MS}ms linear infinite`
                : 'none',
              '@keyframes tn-spin': { to: { transform: 'rotate(360deg)' } },
            }}
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

function renderTooltip(countdown: string): React.ReactNode {
  return (
    <Stack spacing={0.5} sx={{ py: 0.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {LABELS.refreshButton.action}
      </Typography>
      {countdown && (
        <Typography variant="caption" sx={{ opacity: 0.7 }}>
          {APP_LABELS.topbar.refreshesIn} {countdown}
        </Typography>
      )}
    </Stack>
  )
}
