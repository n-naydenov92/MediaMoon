'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import ConstructionIcon from '@mui/icons-material/Construction'
import styles from './LibraryPane.module.css'

export default memo(function LibraryPane(): JSX.Element {
  return (
    <Box component="aside" className={styles.root} aria-label="Library — coming soon">
      <Box className={styles.card}>
        <Box className={styles.iconWrap} aria-hidden>
          <ConstructionIcon className={styles.icon} fontSize="inherit" />
        </Box>
        <Typography component="h3" variant="inherit" className={styles.title}>
          Library — under construction
        </Typography>
        <Typography component="p" variant="inherit" className={styles.body}>
          Top-performing creatives, copy, headlines, CTAs, URLs and UTMs from across
          this brand&apos;s ad accounts will appear here.
        </Typography>
        <Typography component="p" variant="inherit" className={styles.body}>
          You&apos;ll be able to drop a winning element straight into the creator on the left.
        </Typography>
      </Box>
    </Box>
  )
})
