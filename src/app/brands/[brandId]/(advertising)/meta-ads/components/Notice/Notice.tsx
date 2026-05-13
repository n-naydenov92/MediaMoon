import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import styles from './Notice.module.css'

export type NoticeVariant = 'info' | 'error'

interface Props {
  readonly variant: NoticeVariant
  readonly title: ReactNode
  readonly children: ReactNode
}

export default function Notice({ variant, title, children }: Props): JSX.Element {
  return (
    <Box className={styles.notice} data-variant={variant}>
      <Typography component="strong" variant="inherit" className={styles.title}>{title}</Typography>
      <Typography variant="body2" className={styles.body}>{children}</Typography>
    </Box>
  )
}
