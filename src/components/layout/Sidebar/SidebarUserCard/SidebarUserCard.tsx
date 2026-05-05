'use client'

import { memo } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'
import SidebarCollapseToggle from '@/components/layout/Sidebar/SidebarCollapseToggle/SidebarCollapseToggle'
import ThemeToggleButton from './ThemeToggleButton'
import styles from './SidebarUserCard.module.css'

interface Props {
  readonly isCollapsed: boolean
  readonly onToggleCollapse: () => void
  readonly showCollapseToggle?: boolean
}

export default memo(function SidebarUserCard({
  isCollapsed,
  onToggleCollapse,
  showCollapseToggle = true,
}: Props): JSX.Element {
  const { user } = useUser()
  const displayName =
    user?.fullName ?? user?.username ?? user?.primaryEmailAddress?.emailAddress ?? ''

  if (isCollapsed) {
    return (
      <div className={styles.root} data-collapsed="true">
        {showCollapseToggle && (
          <SidebarCollapseToggle isCollapsed onToggle={onToggleCollapse} />
        )}
        <div className={styles.avatar}>
          <UserButton afterSignOutUrl="/sign-in" />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.avatar}>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
      <span className={styles.name} title={displayName}>
        {displayName}
      </span>
      <ThemeToggleButton />
      {showCollapseToggle && (
        <SidebarCollapseToggle
          isCollapsed={false}
          onToggle={onToggleCollapse}
        />
      )}
    </div>
  )
})
