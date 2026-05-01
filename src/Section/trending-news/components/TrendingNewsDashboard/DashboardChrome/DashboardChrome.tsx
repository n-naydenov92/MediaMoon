'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import ActivePanel from '../ActivePanel/ActivePanel'
import styles from './DashboardChrome.module.css'

export default memo(function DashboardChrome(): JSX.Element {
  const { selectedMarket } = useBrandShellContext()

  return (
    <Box className={styles.contentWrapper}>
      <Stack spacing={6}>
        <ActivePanel selectedMarket={selectedMarket} />
      </Stack>
    </Box>
  )
})
