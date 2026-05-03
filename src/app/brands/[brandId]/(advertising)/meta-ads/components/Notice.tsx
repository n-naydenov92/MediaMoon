import type { ReactNode } from 'react'
import styles from './Notice.module.css'

export type NoticeVariant = 'info' | 'error'

interface Props {
  readonly variant: NoticeVariant
  readonly title: ReactNode
  readonly children: ReactNode
}

export default function Notice({ variant, title, children }: Props): JSX.Element {
  return (
    <div className={styles.notice} data-variant={variant}>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  )
}
