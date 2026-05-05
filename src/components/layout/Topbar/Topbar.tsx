'use client'

import { memo, type ReactNode } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined'
import styles from './Topbar.module.css'

interface Props {
  readonly title: string
  readonly leftSlot?: ReactNode
  readonly marketSlot?: ReactNode
  readonly rightSlot?: ReactNode
  readonly onMenuClick?: () => void
  readonly onShowSidebar?: () => void
}

export default memo(function Topbar({
  title,
  leftSlot,
  marketSlot,
  rightSlot,
  onMenuClick,
  onShowSidebar,
}: Props): JSX.Element {
  return (
    <AppBar position="sticky" className={styles.bar}>
      <Toolbar className={styles.toolbar}>
        {onMenuClick && (
          <IconButton
            aria-label="Open navigation"
            onClick={onMenuClick}
            className={styles.menuButton}
            size="small"
          >
            <MenuIcon fontSize="small" />
          </IconButton>
        )}
        {onShowSidebar && (
          <IconButton
            aria-label="Show sidebar"
            onClick={onShowSidebar}
            className={styles.showSidebarButton}
            size="small"
          >
            <ViewSidebarOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        {leftSlot && <div className={styles.leftSlot}>{leftSlot}</div>}
        <span className={styles.title}>{title}</span>
        {marketSlot && <div className={styles.marketSlot}>{marketSlot}</div>}
        <div className={styles.rightSlot}>{rightSlot}</div>
      </Toolbar>
    </AppBar>
  )
})
