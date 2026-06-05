'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import type { CopyOverride, OverridableField } from '../../../perCreativeCopy'
import CreativeStatusBadges from '../../../CreativeStatusBadges/CreativeStatusBadges'
import type { CreativeItem } from '../helpers'
import styles from './CreativePicker.module.css'

interface Props {
  readonly items: readonly CreativeItem[]
  readonly baseFilled: ReadonlySet<OverridableField>
  readonly activeKey: string | null
  readonly activeOverride?: CopyOverride
  readonly onSelect: (key: string) => void
  readonly onOpenList: () => void
}

// Mobile-only replacement for CreativeRail: a compact bar showing the active
// creative with prev/next stepping; tapping it opens the full list as a sheet.
export default memo(function CreativePicker({
  items,
  baseFilled,
  activeKey,
  activeOverride,
  onSelect,
  onOpenList,
}: Props): JSX.Element {
  const index = items.findIndex((i) => i.key === activeKey)
  const active = index >= 0 ? items[index] : null
  const prev = index > 0 ? items[index - 1] : null
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : null

  return (
    <Box className={styles.root}>
      <IconButton
        aria-label="Previous creative"
        disabled={!prev}
        onClick={() => prev && onSelect(prev.key)}
        className={styles.step}
      >
        <ChevronLeftIcon fontSize="inherit" />
      </IconButton>

      <Box
        component="button"
        type="button"
        className={styles.current}
        onClick={onOpenList}
        aria-haspopup="dialog"
        aria-label={active ? `${active.name} — change creative` : 'Choose creative'}
      >
        <Box className={styles.thumbWrap}>
          {active?.thumbUrl ? (
            <Box component="img" src={active.thumbUrl} alt={active.name} className={styles.thumb} loading="lazy" />
          ) : (
            <Box component="span" className={styles.placeholder} aria-hidden>
              <PlayArrowRoundedIcon fontSize="inherit" />
            </Box>
          )}
        </Box>
        <Box className={styles.info}>
          <Typography component="span" variant="inherit" className={styles.name}>
            {active?.name ?? 'Choose creative'}
          </Typography>
          <CreativeStatusBadges baseFilled={baseFilled} override={activeOverride} />
        </Box>
        <Box component="span" className={styles.expand} aria-hidden>
          <ExpandMoreIcon fontSize="inherit" />
        </Box>
      </Box>

      <IconButton
        aria-label="Next creative"
        disabled={!next}
        onClick={() => next && onSelect(next.key)}
        className={styles.step}
      >
        <ChevronRightIcon fontSize="inherit" />
      </IconButton>
    </Box>
  )
})
