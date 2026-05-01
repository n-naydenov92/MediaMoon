'use client'

import { memo, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import { useTrendingNewsContext } from '@/Section/trending-news/context/useTrendingNewsContext'
import { LABELS } from '@/Section/trending-news/labels'

export default memo(function KeywordsPopover(): JSX.Element | null {
  const { topic, activeView } = useTrendingNewsContext()
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  const market = activeView === 'overview' ? null : activeView
  const rawQuery = market ? topic.queries[market] : ''
  const terms = useMemo(() => parseQuery(rawQuery), [rawQuery])

  if (!market || terms.length === 0) {
    return null
  }

  const handleOpen = (): void => setOpen(true)
  const handleClose = (): void => setOpen(false)

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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { p: 3, maxWidth: 360 } } }}
      >
        <Stack spacing={2}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
            {LABELS.keywordsPopover.title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {terms.map((term) => (
              <Chip key={term} label={term} size="small" variant="outlined" />
            ))}
          </Box>
        </Stack>
      </Popover>
    </>
  )
})

function parseQuery(query: string): readonly string[] {
  if (!query.trim()) {
    return []
  }
  return query
    .split(' OR ')
    .map((part) => part.trim().replace(/^"(.*)"$/, '$1').trim())
    .filter((part) => part.length > 0)
}
