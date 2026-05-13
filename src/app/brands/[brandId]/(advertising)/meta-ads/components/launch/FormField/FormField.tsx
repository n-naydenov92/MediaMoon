import type { ReactNode } from 'react'
import styles from './FormField.module.css'

interface Props {
  readonly label: string
  readonly hint?: string
  readonly children: ReactNode
}

export default function FormField({ label, hint, children }: Props): JSX.Element {
  return (
    <label className={styles.field}>
      <span className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </span>
      {children}
    </label>
  )
}
