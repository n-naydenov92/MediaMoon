'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import { LABELS } from '@/components/layout/labels'
import styles from '../BrandMenu/BrandMenu.module.css'

interface Props {
  readonly query: string
}

export default memo(function BrandMenuEmpty({ query }: Props): JSX.Element {
  return (
    <Box className={styles.empty} role="status">
      <Box component="span" className={styles.emptyIcon} aria-hidden="true">
        <Inventory2OutlinedIcon />
      </Box>
      <Box component="span" className={styles.emptyHeadline}>
        {LABELS.sidebar.noBrandsMatch}
      </Box>
      <Box component="span" className={styles.emptyHint}>{`“${query}”`}</Box>
    </Box>
  )
})
