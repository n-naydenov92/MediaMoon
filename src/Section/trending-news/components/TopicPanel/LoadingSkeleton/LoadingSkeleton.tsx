'use client'

import { memo } from 'react'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'

/**
 * Skeleton placeholder shown while a topic tab's news data is loading.
 */
export default memo(function LoadingSkeleton(): JSX.Element {
  return (
    <Stack spacing={4}>
      <Skeleton variant="rounded" height={100} />
      <Skeleton variant="rounded" height={160} />
      <Skeleton variant="rounded" height={160} />
    </Stack>
  )
})
