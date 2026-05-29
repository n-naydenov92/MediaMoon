'use client'

import { memo, type ReactNode } from 'react'
import Typography from '@mui/material/Typography'
import styles from './FieldLabel.module.css'

interface Props {
  readonly children: ReactNode
  readonly htmlFor?: string
}

export default memo(function FieldLabel({ children, htmlFor }: Props): JSX.Element {
  if (htmlFor) {
    return (
      <Typography
        component="label"
        variant="inherit"
        className={styles.label}
        htmlFor={htmlFor}
      >
        {children}
      </Typography>
    )
  }
  return (
    <Typography component="span" variant="inherit" className={styles.label}>
      {children}
    </Typography>
  )
})
