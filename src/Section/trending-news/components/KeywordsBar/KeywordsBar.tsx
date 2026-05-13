'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { ALL_MARKETS } from '@/lib/markets'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'
import { parseQuery } from '@/Section/trending-news/helpers'
import { POPOVER_ANCHOR, POPOVER_TRANSFORM } from '../popoverConfig'
import styles from './KeywordsBar.module.css'

const POPOVER_SLOT_PROPS = { paper: { className: styles.popoverPaper } } as const

function KeywordsBar(): JSX.Element | null {
  const { topic } = useTrendingNewsContext()
  const { selectedMarket } = useBrandShellContext()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const market = selectedMarket === ALL_MARKETS ? null : selectedMarket
  const rawQuery = market ? (topic.queries[market] ?? '') : ''
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
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
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
          <Box className={styles.chips}>
            {terms.map((term) => (
              <Chip key={term} label={term} size="small" variant="outlined" />
            ))}
          </Box>
        </Stack>
      </Popover>
    </>
  )
}

export default memo(KeywordsBar)
