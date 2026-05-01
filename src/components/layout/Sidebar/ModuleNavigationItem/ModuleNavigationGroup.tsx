'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import type { ModuleConfig } from '@/types'
import { findActiveChildModule } from '@/lib/navigation'
import ModuleIcon from '@/components/layout/ModuleIcon/ModuleIcon'
import SidebarTooltip from '@/components/layout/ui/SidebarTooltip'
import ModuleNavigationChild from './ModuleNavigationChild'
import styles from './ModuleNavigationItem.module.css'

const GROUP_ICON_SIZE_PX = 16

interface Props {
  readonly module: ModuleConfig
  readonly brandId: string | null
  readonly isCollapsed: boolean
  readonly forceExpanded: boolean
}

const ModuleNavigationGroup = memo(function ModuleNavigationGroup({
  module: mod,
  brandId,
  isCollapsed,
  forceExpanded,
}: Props): JSX.Element {
  const pathname = usePathname()
  const activeChild = findActiveChildModule(mod.children, brandId, pathname)

  const [internallyExpanded, setInternallyExpanded] = useState(
    () => activeChild !== null,
  )

  const isExpanded = (forceExpanded || internallyExpanded) && !isCollapsed
  const showIndicator = activeChild !== null && (!isExpanded || isCollapsed)
  const tooltipLabel =
    isCollapsed && activeChild ? `${mod.label} — ${activeChild.label}` : mod.label

  const toggle = useCallback(() => {
    setInternallyExpanded((s) => !s)
  }, [])

  useEffect(() => {
    if (activeChild !== null) {
      setInternallyExpanded(true)
    }
  }, [activeChild])

  return (
    <div className={styles.group}>
      <SidebarTooltip label={tooltipLabel} enabled={isCollapsed}>
        <button
          type="button"
          className={styles.row}
          data-collapsed={isCollapsed}
          data-has-active-child={showIndicator}
          aria-expanded={isExpanded}
          aria-label={tooltipLabel}
          onClick={toggle}
        >
          <span className={styles.icon} aria-hidden="true">
            <ModuleIcon name={mod.icon} size={GROUP_ICON_SIZE_PX} />
          </span>
          {!isCollapsed && (
            <>
              <span className={styles.label}>{mod.label}</span>
              {showIndicator && (
                <span className={styles.activeDot} aria-hidden="true" />
              )}
              <KeyboardArrowDownIcon
                className={styles.chevron}
                fontSize="small"
                data-expanded={isExpanded}
              />
            </>
          )}
        </button>
      </SidebarTooltip>

      {isExpanded && (
        <ul className={styles.children}>
          {mod.children?.map((child) => (
            <li key={child.id}>
              <ModuleNavigationChild
                module={child}
                brandId={brandId}
                pathname={pathname}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
})

export default ModuleNavigationGroup
