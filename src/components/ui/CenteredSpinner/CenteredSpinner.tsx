'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
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
    <Box role="status" aria-live="polite" className={styles.root}>
      <CircularProgress size={size} />
      {label && <Typography variant="caption" color="text.secondary">{label}</Typography>}
    </Box>
  )
})
