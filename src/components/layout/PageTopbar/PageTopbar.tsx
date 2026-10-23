'use client'

import { memo } from 'react'
import Topbar from '@/components/layout/Topbar/Topbar'
import { useMobileNav } from '@/components/layout/AppShell/MobileNavContext'

interface Props {
  readonly title: string
}

/** The top bar of a page outside a brand: its title and the navigation buttons. */
export default memo(function PageTopbar({ title }: Props): JSX.Element {
  const { openMobileNav, desktopSidebarHidden, showDesktopSidebar } = useMobileNav()
  return (
    <Topbar
      title={title}
      onMenuClick={openMobileNav}
      onShowSidebar={desktopSidebarHidden ? showDesktopSidebar : undefined}
    />
  )
})
