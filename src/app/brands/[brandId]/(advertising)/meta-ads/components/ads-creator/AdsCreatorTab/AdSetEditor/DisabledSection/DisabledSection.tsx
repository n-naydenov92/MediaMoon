'use client'

import { memo, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import SectionTitle from '../SectionTitle/SectionTitle'
import styles from './DisabledSection.module.css'

interface Props {
  readonly title: string
  readonly icon: ReactNode
}

export default memo(function DisabledSection({ title, icon }: Props): JSX.Element {
  return (
    <Box className={styles.root} aria-disabled>
      <SectionTitle icon={icon}>{title}</SectionTitle>
      <Typography component="span" variant="inherit" className={styles.hint}>
        Coming soon
      </Typography>
    </Box>
  )
})
