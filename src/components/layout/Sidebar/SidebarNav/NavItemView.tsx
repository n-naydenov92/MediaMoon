'use client'

import { memo } from 'react'
import Link from 'next/link'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Tooltip from '@mui/material/Tooltip'
import type { NavItem } from '@/types'
import { buildHref, isHrefActive } from '@/config/sidebarNav'
import ModuleIcon from '@/components/layout/ModuleIcon/ModuleIcon'
import styles from './SidebarNav.module.css'

const ITEM_ICON_SIZE_PX = 18

interface Props {
  readonly item: NavItem
  readonly brandId: string | null
  readonly pathname: string
  readonly onDrillInto: (itemId: string) => void
}

export default memo(function NavItemView({
  item,
  brandId,
  pathname,
  onDrillInto,
}: Props): JSX.Element {
  if (item.kind === 'link') {
    if (brandId === null) {
      return (
        <span className={styles.row} data-disabled="true">
          <ModuleIcon name={item.icon} size={ITEM_ICON_SIZE_PX} />
          <span className={styles.label}>{item.label}</span>
        </span>
      )
    }
    if (item.disabled) {
      return (
        <Tooltip title="Coming soon" placement="right" arrow disableInteractive>
          <span className={styles.row} data-disabled="true" aria-disabled="true">
            <ModuleIcon name={item.icon} size={ITEM_ICON_SIZE_PX} />
            <span className={styles.label}>{item.label}</span>
          </span>
        </Tooltip>
      )
    }
    const href = buildHref(brandId, item.pathSuffix)
    const isActive = isHrefActive(pathname, href, item.pathSuffix)
    return (
      <Link
        href={href}
        className={styles.row}
        data-active={isActive}
        aria-current={isActive ? 'page' : undefined}
      >
        <ModuleIcon name={item.icon} size={ITEM_ICON_SIZE_PX} />
        <span className={styles.label}>{item.label}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={styles.row}
      onClick={() => onDrillInto(item.id)}
      aria-haspopup="menu"
    >
      <ModuleIcon name={item.icon} size={ITEM_ICON_SIZE_PX} />
      <span className={styles.label}>{item.label}</span>
      <ChevronRightIcon className={styles.chevron} fontSize="small" />
    </button>
  )
})
