'use client'

import { memo } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'

interface Props {
  readonly label: string
  readonly value: number
  readonly accent: string | undefined
}

/**
 * Single stat card displaying a metric label and numeric value with optional accent color.
 */
export default memo(function StatCard({ label, value, accent }: Props): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </Typography>
          <Typography
            component="div"
            sx={{
              fontFamily: 'var(--font-syne), sans-serif',
              fontSize: 32,
              fontWeight: 700,
              color: accent ?? 'text.primary',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {value}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  )
})
