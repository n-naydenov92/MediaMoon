'use client'

import { memo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import styles from './SectionTitle.module.css'

interface Props {
  readonly icon: ReactNode
  readonly children: string
}

export default memo(function SectionTitle({ icon, children }: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box component="span" className={styles.iconWrap} aria-hidden>
        {icon}
      </Box>
      <Typography component="span" variant="inherit" className={styles.text}>
        {children}
      </Typography>
    </Box>
  )
})
