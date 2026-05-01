'use client'

import { memo } from 'react'
import Link from 'next/link'
import type { ModuleConfig } from '@/types'
import { buildModuleHref, isPathnameActive } from '@/lib/navigation'
import { cssVars } from '@/lib/css'
import ModuleIcon from '@/components/layout/ModuleIcon/ModuleIcon'
import styles from './ModuleNavigationItem.module.css'

const CHILD_ICON_SIZE_PX = 14

interface Props {
  readonly module: ModuleConfig
  readonly brandId: string | null
  readonly pathname: string | null
}

const ModuleNavigationChild = memo(function ModuleNavigationChild({
  module: mod,
  brandId,
  pathname,
}: Props): JSX.Element {
  const href = buildModuleHref(mod, brandId)
  const isActive = isPathnameActive(pathname, href)
  const activeStyle = isActive ? cssVars({ '--accent': mod.color }) : undefined

  return (
    <Link
      href={href}
      className={styles.childRow}
      data-active={isActive}
      aria-current={isActive ? 'page' : undefined}
      style={activeStyle}
    >
      <span className={styles.childIcon} aria-hidden="true">
        <ModuleIcon name={mod.icon} size={CHILD_ICON_SIZE_PX} />
      </span>
      <span className={styles.childLabel}>{mod.label}</span>
    </Link>
  )
})

export default ModuleNavigationChild
