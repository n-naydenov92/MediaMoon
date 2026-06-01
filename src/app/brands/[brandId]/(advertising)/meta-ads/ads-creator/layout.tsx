import Box from '@mui/material/Box'
import type { ReactNode } from 'react'
import styles from './layout.module.css'

interface Props {
  readonly children: ReactNode
}

export default function AdsCreatorLayout({ children }: Props): JSX.Element {
  return <Box className={styles.layout}>{children}</Box>
}
