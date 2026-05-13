'use client'

import { memo } from 'react'
import type { CSSProperties } from 'react'
import Box from '@mui/material/Box'
import { clampPercent, type ChannelKind } from '../klaviyoShared'
import styles from './MiniBar.module.css'

interface Props {
  readonly channel: ChannelKind
  readonly label: string
  readonly value: string
  readonly percent: number
}

export default memo(function MiniBar({ channel, label, value, percent }: Props): JSX.Element {
  const fillStyle = { '--bar-fill-width': `${clampPercent(percent)}%` } as CSSProperties
  return (
    <Box className={styles.row}>
      <Box component="span" className={styles.label}>
        {label}
      </Box>
      <Box className={styles.track}>
        <Box className={styles.fill} data-channel={channel} style={fillStyle} />
      </Box>
      <Box component="span" className={styles.value}>
        {value}
      </Box>
    </Box>
  )
})
