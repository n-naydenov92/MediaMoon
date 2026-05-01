'use client'

import { memo, type ReactNode } from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import styles from './Topbar.module.css'

interface Props {
  readonly title: string
  readonly leftSlot?: ReactNode
  readonly rightSlot?: ReactNode
}

export default memo(function Topbar({
  title,
  leftSlot,
  rightSlot,
}: Props): JSX.Element {
  return (
    <AppBar position="sticky" className={styles.bar}>
      <Toolbar className={styles.toolbar}>
        <div className={styles.leftSlot}>{leftSlot}</div>
        <span className={styles.title}>{title}</span>
        <div className={styles.rightSlot}>{rightSlot}</div>
      </Toolbar>
    </AppBar>
  )
})
