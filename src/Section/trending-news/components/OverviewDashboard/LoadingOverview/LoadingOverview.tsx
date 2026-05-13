'use client'

import { memo } from 'react'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

/**
 * Skeleton placeholder shown while overview data is being loaded for the first time.
 */
export default memo((): JSX.Element => (
  <Stack spacing={4}>
    <Skeleton variant="rounded" height={100} />
    <Skeleton variant="rounded" height={160} />
    <Skeleton variant="rounded" height={160} />
  </Stack>
))
