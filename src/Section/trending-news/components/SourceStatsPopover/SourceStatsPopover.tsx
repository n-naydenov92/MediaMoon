'use client'

import { memo, useCallback, useRef, useState } from 'react'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DataUsageOutlined from '@mui/icons-material/DataUsageOutlined'
import { ALL_MARKETS } from '@/lib/markets'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { LABELS } from '@/Section/trending-news/labels'
import { hasAnyError } from '@/Section/trending-news/helpers'
import { POPOVER_ANCHOR, POPOVER_TRANSFORM } from '../popoverConfig'
import SourceDebugRow from '../SourceDebugRow/SourceDebugRow'
import styles from './SourceStatsPopover.module.css'

const POPOVER_SLOT_PROPS = { paper: { className: styles.popoverPaper } } as const

export default memo(function SourceStatsPopover(): JSX.Element | null {
  const { brandId, dataByKey } = useTrendingNewsContext()
  const { selectedMarket } = useBrandShellContext()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const handleOpen = useCallback((): void => setOpen(true), [])
  const handleClose = useCallback((): void => setOpen(false), [])

  if (selectedMarket === ALL_MARKETS) {
    return null
  }

  const state = dataByKey.get(cacheKey(brandId, selectedMarket))
  if (state?.status !== 'success') {
    return null
  }

  const { sourceCounts, sourceErrors } = state.data
  const hasError = hasAnyError(sourceErrors)

  return (
    <>
      <Tooltip title={LABELS.sourceStatsPopover.tooltip} placement="top" arrow>
        <IconButton
          ref={anchorRef}
          size="small"
          onClick={handleOpen}
          aria-label={LABELS.sourceStatsPopover.tooltip}
        >
          <Badge color="error" variant="dot" invisible={!hasError} overlap="circular">
            <DataUsageOutlined fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={POPOVER_ANCHOR}
        transformOrigin={POPOVER_TRANSFORM}
        slotProps={POPOVER_SLOT_PROPS}
      >
        <Stack spacing={2}>
          <Typography variant="caption" className={styles.title}>
            {LABELS.sourceStatsPopover.title}
          </Typography>
          <SourceDebugRow sourceCounts={sourceCounts} sourceErrors={sourceErrors} />
        </Stack>
      </Popover>
    </>
  )
})
