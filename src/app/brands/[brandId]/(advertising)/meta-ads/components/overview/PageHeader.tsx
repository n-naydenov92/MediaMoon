'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import styles from './PageHeader.module.css'

export interface Crumb {
  readonly label: string
  readonly href?: string
}

interface Props {
  readonly crumbs: readonly Crumb[]
  readonly actions?: ReactNode
}

export default function PageHeader({ crumbs, actions }: Props): JSX.Element {
  return (
    <header className={styles.root}>
      <nav className={styles.crumbs} aria-label="Breadcrumb">
        <ol className={styles.list}>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            return (
              <li key={`${crumb.label}-${index}`} className={styles.item}>
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className={styles.link}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? styles.current : styles.label}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && (
                  <span aria-hidden="true" className={styles.sep}>
                    /
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
