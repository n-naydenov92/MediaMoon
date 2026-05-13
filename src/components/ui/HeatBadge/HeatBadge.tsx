'use client'

import { memo } from 'react'
import Chip from '@mui/material/Chip'
import type { HeatLevel } from '@/types'
import { LABELS } from '@/components/ui/labels'
import styles from './HeatBadge.module.css'

const HEAT_STYLES: Record<HeatLevel, { bg: string; fg: string }> = {
  viral: { bg: 'rgba(245, 158, 11, 0.15)', fg: '#F59E0B' },
  hot: { bg: 'rgba(249, 115, 22, 0.15)', fg: '#F97316' },
  normal: { bg: 'rgba(100, 116, 139, 0.15)', fg: '#94A3B8' },
}

const HEAT_LABELS: Record<HeatLevel, string> = {
  viral: LABELS.heat.viral,
  hot: LABELS.heat.hot,
  normal: LABELS.heat.normal,
}

interface Props {
  readonly heat: HeatLevel
}

/**
 * Colour-coded chip badge indicating a news cluster's heat level (viral / hot / normal).
 */
export default memo(function HeatBadge({ heat }: Props): JSX.Element {
  const { bg, fg } = HEAT_STYLES[heat]
  return (
    <Chip
      size="small"
      label={HEAT_LABELS[heat]}
      className={styles.badge}
      sx={{ backgroundColor: bg, color: fg }}
    />
  )
})
