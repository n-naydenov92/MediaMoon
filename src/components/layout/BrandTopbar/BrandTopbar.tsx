'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import Topbar from '@/components/layout/Topbar/Topbar'
import MarketSwitcher from '@/components/layout/Topbar/MarketSwitcher/MarketSwitcher'
import TopbarOverflowMenu from '@/components/layout/Topbar/TopbarOverflowMenu/TopbarOverflowMenu'
import { useMobileNav } from '@/components/layout/AppShell/MobileNavContext'
import { findModuleById } from '@/config/modules'
import { extractModuleId } from './helpers'

const BrandTopbar = memo(function BrandTopbar(): JSX.Element {
  const pathname = usePathname()
  const moduleId = extractModuleId(pathname)
  const activeModule = moduleId ? findModuleById(moduleId) : null
  const title = activeModule?.label ?? ''
  const {
    openMobileNav,
    desktopSidebarHidden,
    showDesktopSidebar,
  } = useMobileNav()

  return (
    <Topbar
      title={title}
      marketSlot={<MarketSwitcher />}
      rightSlot={<TopbarOverflowMenu />}
      onMenuClick={openMobileNav}
      onShowSidebar={desktopSidebarHidden ? showDesktopSidebar : undefined}
    />
  )
})

export default BrandTopbar
