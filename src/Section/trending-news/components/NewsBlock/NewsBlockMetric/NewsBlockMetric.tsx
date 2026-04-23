'use client'

import { memo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface Props {
  readonly label: string
  readonly value: string
}

/**
 * A single label/value metric displayed inside a news block header.
 */
export default memo(function NewsBlockMetric({ label, value }: Props): JSX.Element {
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      <Typography variant="caption" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
        {value}
      </Typography>
    </Stack>
  )
})
