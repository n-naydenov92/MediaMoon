'use client'

import { memo, useEffect, useState } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import BoltIcon from '@mui/icons-material/Bolt'
import { LABELS } from '@/components/layout/labels'
import { formatRemaining } from '@/components/layout/Topbar/helpers'

interface Props {
  readonly cacheExpiresAt: string | null | undefined
}

/**
 * Live countdown label showing time remaining until the next cache refresh.
 * Updates every 30 seconds. Returns null when no expiry is set.
 */
export default memo(function CacheStatus({ cacheExpiresAt }: Props): JSX.Element | null {
  const [label, setLabel] = useState<string>(() =>
    cacheExpiresAt ? formatRemaining(cacheExpiresAt) : '',
  )

  useEffect(() => {
    if (!cacheExpiresAt) {
      return
    }
    setLabel(formatRemaining(cacheExpiresAt))
    const timer = setInterval(() => {
      setLabel(formatRemaining(cacheExpiresAt))
    }, 30_000)
    return () => clearInterval(timer)
  }, [cacheExpiresAt])

  if (!cacheExpiresAt) {
    return null
  }

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <BoltIcon fontSize="small" sx={{ color: 'text.secondary', fontSize: 14 }} />
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
        {LABELS.topbar.refreshesIn} {label}
      </Typography>
    </Stack>
  )
})
