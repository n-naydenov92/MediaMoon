'use client'

import { memo, useMemo } from 'react'
import type { ModuleConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import ModuleNavigationItem from '@/components/layout/Sidebar/ModuleNavigationItem/ModuleNavigationItem'
import ModuleNavigationEmpty from './ModuleNavigationEmpty'
import { filterModules } from './filterModules'
import styles from './ModuleNavigation.module.css'

interface Props {
  readonly modules: readonly ModuleConfig[]
  readonly brandId: string | null
  readonly searchQuery: string
  readonly isCollapsed: boolean
}

export default memo(function ModuleNavigation({
  modules,
  brandId,
  searchQuery,
  isCollapsed,
}: Props): JSX.Element {
  const visible = useMemo(
    () => (brandId === null ? modules.filter((m) => m.global) : modules),
    [modules, brandId],
  )
  const filtered = useMemo(
    () => filterModules(visible, searchQuery),
    [visible, searchQuery],
  )

  const hasQuery = searchQuery.trim().length > 0

  if (filtered.length === 0) {
    return (
      <ModuleNavigationEmpty
        hasQuery={hasQuery}
        searchQuery={searchQuery}
        brandId={brandId}
        isCollapsed={isCollapsed}
      />
    )
  }

  return (
    <nav className={styles.root} aria-label={LABELS.sidebar.navAriaLabel}>
      {filtered.map((mod) => (
        <ModuleNavigationItem
          key={mod.id}
          module={mod}
          brandId={brandId}
          isCollapsed={isCollapsed}
          forceExpanded={hasQuery}
        />
      ))}
    </nav>
  )
})
