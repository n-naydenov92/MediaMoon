'use client'

import { memo } from 'react'
import Link from 'next/link'
import type { ModuleConfig } from '@/types'
import { buildModuleHref, isPathnameActive } from '@/lib/navigation'
import { cssVars } from '@/lib/css'
import ModuleIcon from '@/components/layout/ModuleIcon/ModuleIcon'
import SidebarTooltip from '@/components/layout/ui/SidebarTooltip'
import styles from './ModuleNavigationItem.module.css'

const LEAF_ICON_SIZE_PX = 16

interface Props {
  readonly module: ModuleConfig
  readonly brandId: string | null
  readonly pathname: string | null
  readonly isCollapsed: boolean
}

const ModuleNavigationLeaf = memo(function ModuleNavigationLeaf({
  module: mod,
  brandId,
  pathname,
  isCollapsed,
}: Props): JSX.Element {
  const href = buildModuleHref(mod, brandId)
  const isActive = isPathnameActive(pathname, href)
  const activeStyle = isActive ? cssVars({ '--accent': mod.color }) : undefined

  return (
    <SidebarTooltip label={mod.label} enabled={isCollapsed}>
      <Link
        href={href}
        className={styles.row}
        data-collapsed={isCollapsed}
        data-active={isActive}
        aria-current={isActive ? 'page' : undefined}
        aria-label={mod.label}
        style={activeStyle}
      >
        <span className={styles.icon} aria-hidden="true">
          <ModuleIcon name={mod.icon} size={LEAF_ICON_SIZE_PX} />
        </span>
        {!isCollapsed && <span className={styles.label}>{mod.label}</span>}
      </Link>
    </SidebarTooltip>
  )
})

export default ModuleNavigationLeaf
