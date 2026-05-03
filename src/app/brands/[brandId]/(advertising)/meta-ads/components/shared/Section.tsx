import type { ReactNode } from 'react'
import { cls } from '@/lib/css'
import styles from './Section.module.css'

interface Props {
  readonly title?: ReactNode
  readonly action?: ReactNode
  readonly children: ReactNode
  readonly className?: string
}

export default function Section({ title, action, children, className }: Props): JSX.Element {
  return (
    <section className={cls(styles.section, className)}>
      {(title || action) && (
        <header className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}
