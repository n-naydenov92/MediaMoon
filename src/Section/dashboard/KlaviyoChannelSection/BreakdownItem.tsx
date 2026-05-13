'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import { formatPercentage } from '@/lib/meta/fx'
import { clampPercent, type ChannelKind } from './klaviyoShared'
import styles from './BreakdownItem.module.css'

interface Props {
  readonly channel: ChannelKind
  readonly icon: ReactNode
  readonly label: string
  readonly value: string
  readonly percent: number
}

export default memo(function BreakdownItem({ channel, icon, label, value, percent }: Props): JSX.Element {
  const safePercent = clampPercent(percent)
  return (
    <Box className={styles.item}>
      <Box className={styles.header}>
        <Box
          component="span"
          className={styles.icon}
          data-channel={channel}
          aria-hidden="true"
        >
          {icon}
        </Box>
        <Box component="span" className={styles.label}>
          {label}
        </Box>
      </Box>
      <Box className={styles.valueRow}>
        <Box component="span" className={styles.value}>
          {value}
        </Box>
        <Box component="span" className={styles.percent}>
          {`· ${formatPercentage(safePercent / 100, 1)}`}
        </Box>
      </Box>
    </Box>
  )
})
