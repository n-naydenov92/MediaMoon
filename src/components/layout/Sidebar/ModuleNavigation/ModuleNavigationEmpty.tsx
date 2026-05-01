'use client'

import { memo } from 'react'
import styles from './ModuleNavigation.module.css'

interface Props {
  readonly hasQuery: boolean
  readonly searchQuery: string
  readonly brandId: string | null
  readonly isCollapsed: boolean
}

const ModuleNavigationEmpty = memo(function ModuleNavigationEmpty({
  hasQuery,
  searchQuery,
  brandId,
  isCollapsed,
}: Props): JSX.Element {
  if (hasQuery) {
    return (
      <div className={styles.empty} role="status">
        No modules match “{searchQuery}”.
      </div>
    )
  }

  if (brandId === null && !isCollapsed) {
    return (
      <div className={styles.hint} role="status">
        Select a brand to view its modules.
      </div>
    )
  }

  return <div className={styles.spacer} aria-hidden="true" />
})

export default ModuleNavigationEmpty
