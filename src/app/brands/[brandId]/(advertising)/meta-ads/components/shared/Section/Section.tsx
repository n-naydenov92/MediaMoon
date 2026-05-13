import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { cls } from '@/lib/css'
import styles from './Section.module.css'

interface Props {
  readonly title?: ReactNode
  readonly action?: ReactNode
  readonly children: ReactNode
  readonly className?: string
  readonly bare?: boolean
}

export default function Section({ title, action, children, className, bare = false }: Props): JSX.Element {
  return (
    <Box component="section" className={cls(styles.section, className)} data-bare={bare ? 'true' : undefined}>
      {(title || action) && (
        <Box component="header" className={styles.header}>
          {title && <Typography component="h2" variant="h2" className={styles.title}>{title}</Typography>}
          {action && <Box className={styles.action}>{action}</Box>}
        </Box>
      )}
      <Box className={styles.body}>{children}</Box>
    </Box>
  )
}
