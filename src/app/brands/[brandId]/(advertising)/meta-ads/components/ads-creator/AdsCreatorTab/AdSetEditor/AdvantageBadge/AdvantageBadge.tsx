'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import styles from './AdvantageBadge.module.css'

interface Props {
  readonly on: boolean
}

export default memo(function AdvantageBadge({ on }: Props): JSX.Element {
  return (
    <Box component="span" className={styles.badge} data-on={on ? 'true' : 'false'}>
      {on && (
        <AutoAwesomeOutlinedIcon fontSize="inherit" className={styles.icon} />
      )}
      {on ? 'Advantage+ ON' : 'Advantage+ OFF'}
    </Box>
  )
})
