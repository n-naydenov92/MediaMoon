'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'
import { parseQuery } from '@/Section/trending-news/helpers'
import styles from './KeywordsBar.module.css'

const POPOVER_ANCHOR = { vertical: 'bottom', horizontal: 'right' } as const
const POPOVER_TRANSFORM = { vertical: 'top', horizontal: 'right' } as const
const POPOVER_SLOT_PROPS = { paper: { className: styles.popoverPaper } } as const

export default memo(function KeywordsPopover(): JSX.Element | null {
  const { topic, activeView } = useTrendingNewsContext()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const market = activeView === 'overview' ? null : activeView
  const rawQuery = market ? topic.queries[market] : ''
  const terms = useMemo(() => parseQuery(rawQuery), [rawQuery])

  const handleOpen = useCallback((): void => setOpen(true), [])
  const handleClose = useCallback((): void => setOpen(false), [])

  if (!market || terms.length === 0) {
    return null
  }

  return (
    <>
      <Tooltip title={LABELS.keywordsPopover.tooltip} placement="top" arrow>
        <IconButton
          ref={anchorRef}
          size="small"
          onClick={handleOpen}
          aria-label={LABELS.keywordsPopover.tooltip}
        >
          <InfoOutlined fontSize="small" />
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
            {LABELS.keywordsPopover.title}
          </Typography>
          <div className={styles.chips}>
            {terms.map((term) => (
              <Chip key={term} label={term} size="small" variant="outlined" />
            ))}
          </div>
        </Stack>
      </Popover>
    </>
  )
})
