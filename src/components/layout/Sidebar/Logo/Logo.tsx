'use client'

import { memo } from 'react'
import Typography from '@mui/material/Typography'
import { LABELS } from '@/components/layout/labels'

/**
 * Application wordmark displayed at the top of the sidebar.
 */
export default memo(function Logo(): JSX.Element {
  return (
    <Typography variant="h1" sx={{ fontSize: 20, letterSpacing: '-0.02em', fontWeight: 700, px: 2 }}>
      {LABELS.app.name}
    </Typography>
  )
})
