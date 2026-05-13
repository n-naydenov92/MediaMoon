'use client'

import { memo, useState } from 'react'
import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'
import type { BrandConfig, UserRole } from '@/types'
import { LABELS } from '@/components/layout/labels'
import { getActiveBrandId } from '@/lib/navigation'
import { useThemeMode } from '@/styles/useThemeMode'
import { cssVars } from '@/lib/css'
import { useMobileNav } from '@/components/layout/AppShell/MobileNavContext'
import BrandSwitcher from '@/components/layout/Sidebar/BrandSwitcher/BrandSwitcher'
import SidebarSearch from '@/components/layout/Sidebar/SidebarSearch/SidebarSearch'
import SidebarNav from '@/components/layout/Sidebar/SidebarNav/SidebarNav'
import SidebarUserCard from '@/components/layout/Sidebar/SidebarUserCard/SidebarUserCard'
import SidebarResizeHandle from '@/components/layout/Sidebar/SidebarResizeHandle/SidebarResizeHandle'
import { useSidebarResize } from '@/components/layout/Sidebar/SidebarResizeHandle/useSidebarResize'
import styles from './Sidebar.module.css'

interface Props {
  readonly brands: readonly BrandConfig[]
  readonly role: UserRole | null
  readonly variant?: 'fixed' | 'drawer'
  readonly hidden?: boolean
}

export default memo(function Sidebar({
  brands,
  role,
  variant = 'fixed',
  hidden = false,
}: Props): JSX.Element {
  const pathname = usePathname()
  const { mode } = useThemeMode()
  const { hideDesktopSidebar } = useMobileNav()
  const resize = useSidebarResize()
  const [searchQuery, setSearchQuery] = useState('')

  const brandId = getActiveBrandId(pathname)

  const styleVars =
    variant === 'fixed' ? cssVars({ '--sidebar-width': `${resize.width}px` }) : undefined

  return (
    <Box
      component="aside"
      className={styles.root}
      data-variant={variant}
      data-hidden={hidden}
      data-collapsing={resize.isCollapsing}
      data-theme={mode}
      style={styleVars}
      aria-label={LABELS.sidebar.primaryNavAriaLabel}
      aria-hidden={hidden}
    >
      <Box className={styles.brandSection}>
        <BrandSwitcher brands={brands} />
      </Box>

      <Box className={styles.searchSlot}>
        <SidebarSearch value={searchQuery} onChange={setSearchQuery} />
      </Box>

      {role !== null && <SidebarNav brandId={brandId} role={role} />}

      <SidebarUserCard variant={variant} />

      {variant === 'fixed' && (
        <SidebarResizeHandle
          currentWidth={resize.width}
          minWidth={resize.minWidth}
          maxWidth={resize.maxWidth}
          closeThreshold={resize.closeThreshold}
          onWidthChange={resize.setWidth}
          onCollapsingChange={resize.setCollapsing}
          onClose={hideDesktopSidebar}
        />
      )}
    </Box>
  )
})
