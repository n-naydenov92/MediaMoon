'use client'

import { memo, useRef, useState } from 'react'
import Badge from '@mui/material/Badge'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DataUsageOutlined from '@mui/icons-material/DataUsageOutlined'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { cacheKey } from '@/Section/trending-news/context/trendingNewsCtx'
import { LABELS } from '@/Section/trending-news/labels'
import SourceDebugRow from '../SourceDebugRow/SourceDebugRow'

export default memo(function SourceStatsPopover(): JSX.Element | null {
  const { brandId, activeView, dataByKey } = useTrendingNewsContext()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  if (activeView === 'overview') {
    return null
  }

  const state = dataByKey.get(cacheKey(brandId, activeView))
  if (state?.status !== 'success') {
    return null
  }

  const { sourceCounts, sourceErrors } = state.data
  const hasError = Object.values(sourceErrors).some((e) => Boolean(e))

  const handleOpen = (): void => setOpen(true)
  const handleClose = (): void => setOpen(false)

  return (
    <>
      <Tooltip title={LABELS.sourceStatsPopover.tooltip} placement="top" arrow>
        <IconButton
          ref={anchorRef}
          size="small"
          onClick={handleOpen}
          aria-label={LABELS.sourceStatsPopover.tooltip}
        >
          <Badge
            color="error"
            variant="dot"
            invisible={!hasError}
            overlap="circular"
          >
            <DataUsageOutlined fontSize="small" />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 3, maxWidth: 420 } } }}
      >
        <Stack spacing={2}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {LABELS.sourceStatsPopover.title}
          </Typography>
          <SourceDebugRow sourceCounts={sourceCounts} sourceErrors={sourceErrors} />
        </Stack>
      </Popover>
    </>
  )
})
