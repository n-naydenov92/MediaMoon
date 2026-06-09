'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import type { CopyOverride, OverridableField } from '../../../perCreativeCopy'
import CreativeStatusBadges from '../../../CreativeStatusBadges/CreativeStatusBadges'
import type { CreativeItem } from '../helpers'
import styles from './CreativePicker.module.css'

interface Props {
  readonly items: readonly CreativeItem[]
  readonly baseFilled: ReadonlySet<OverridableField>
  readonly activeKey: string | null
  readonly activeOverride?: CopyOverride
  // Keys of creatives missing a required field — drives the directional error
  // tint on the arrows and the jump-to-next-error step.
  readonly errorKeys: ReadonlySet<string>
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
  errorKeys,
  onSelect,
  onOpenList,
}: Props): JSX.Element {
  const index = items.findIndex((i) => i.key === activeKey)
  const active = index >= 0 ? items[index] : null
  const prev = index > 0 ? items[index - 1] : null
  const next = index >= 0 && index < items.length - 1 ? items[index + 1] : null

  const prevHasError = index > 0 && items.slice(0, index).some((i) => errorKeys.has(i.key))
  const nextHasError = index >= 0 && items.slice(index + 1).some((i) => errorKeys.has(i.key))
  const othersWithErrors = items.filter((i) => i.key !== activeKey && errorKeys.has(i.key)).length

  function jumpToNextError(): void {
    if (index < 0) return
    for (let step = 1; step <= items.length; step += 1) {
      const candidate = items[(index + step) % items.length]!
      if (candidate.key !== activeKey && errorKeys.has(candidate.key)) {
        onSelect(candidate.key)
        return
      }
    }
  }

  return (
    <Box className={styles.root}>
      <IconButton
        aria-label="Previous creative"
        disabled={!prev}
        onClick={() => prev && onSelect(prev.key)}
        className={styles.step}
        data-error={prevHasError ? 'true' : 'false'}
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
        data-error={nextHasError ? 'true' : 'false'}
      >
        <ChevronRightIcon fontSize="inherit" />
      </IconButton>

      {othersWithErrors > 0 && (
        <Tooltip title="Go to next creative with errors" placement="top" disableInteractive>
          <Box
            component="button"
            type="button"
            className={styles.jump}
            onClick={jumpToNextError}
            aria-label={`${othersWithErrors} other creatives have errors — go to next`}
          >
            <WarningAmberRoundedIcon fontSize="small" />
            <Typography component="span" variant="caption">{othersWithErrors}</Typography>
          </Box>
        </Tooltip>
      )}
    </Box>
  )
})
