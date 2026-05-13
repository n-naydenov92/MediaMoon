'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import styles from './CenteredSpinner.module.css'

interface Props {
  readonly label?: string
  readonly size?: number
}

/**
 * Full-width centered loading spinner with optional accessible label.
 */
export default memo(function CenteredSpinner({ label, size = 24 }: Props): JSX.Element {
  return (
    <Box role="status" aria-live="polite" className={styles.root} sx={{ gap: 3, py: 12 }}>
      <CircularProgress size={size} />
      {label && <Box sx={{ color: 'text.secondary', fontSize: 12 }}>{label}</Box>}
    </Box>
  )
})
