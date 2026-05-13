'use client'

import { memo } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
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
        <Box component="span" className={styles.row} data-disabled="true">
          <ModuleIcon name={item.icon} size={ITEM_ICON_SIZE_PX} />
          <Box component="span" className={styles.label}>{item.label}</Box>
        </Box>
      )
    }
    if (item.disabled) {
      return (
        <Tooltip title="Coming soon" placement="right" arrow disableInteractive>
          <Box
            component="span"
            className={styles.row}
            data-disabled="true"
            aria-disabled="true"
          >
            <ModuleIcon name={item.icon} size={ITEM_ICON_SIZE_PX} />
            <Box component="span" className={styles.label}>{item.label}</Box>
          </Box>
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
        <Box component="span" className={styles.label}>{item.label}</Box>
      </Link>
    )
  }

  return (
    <Box
      component="button"
      type="button"
      className={styles.row}
      onClick={() => onDrillInto(item.id)}
      aria-haspopup="menu"
    >
      <ModuleIcon name={item.icon} size={ITEM_ICON_SIZE_PX} />
      <Box component="span" className={styles.label}>{item.label}</Box>
      <ChevronRightIcon className={styles.chevron} fontSize="small" />
    </Box>
  )
})
