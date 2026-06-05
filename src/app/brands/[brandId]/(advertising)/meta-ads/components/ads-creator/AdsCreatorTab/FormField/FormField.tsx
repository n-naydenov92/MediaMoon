import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import styles from './FormField.module.css'

interface Props {
  readonly label: string
  readonly hint?: string
  readonly labelAside?: ReactNode
  readonly children: ReactNode
}

export default function FormField({ label, hint, labelAside, children }: Props): JSX.Element {
  return (
    <Box component="label" className={styles.field}>
      <Box component="span" className={styles.labelRow}>
        <Typography component="span" variant="inherit" className={styles.label}>{label}</Typography>
        {hint && <Typography component="span" variant="inherit" className={styles.hint}>{hint}</Typography>}
        {labelAside}
      </Box>
      {children}
    </Box>
  )
}
