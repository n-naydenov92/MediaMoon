'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Sidebar from '@/components/layout/Sidebar/Sidebar'
import type { BrandConfig, UserRole } from '@/types'
import { MobileNavProvider } from './MobileNavContext'
import styles from './AppShell.module.css'

interface Props {
  readonly brands: readonly BrandConfig[]
  readonly role: UserRole | null
  readonly children: ReactNode
}

const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up', '/sso-callback'] as const

function isAuthPathname(pathname: string | null): boolean {
  if (pathname === null) {
    return false
  }
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export default memo(({ brands, role, children }: Props): JSX.Element => {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [desktopHidden, setDesktopHidden] = useState(false)

  const openMobileNav = useCallback(() => setMobileOpen(true), [])
  const closeMobileNav = useCallback(() => setMobileOpen(false), [])
  const hideDesktopSidebar = useCallback(() => setDesktopHidden(true), [])
  const showDesktopSidebar = useCallback(() => setDesktopHidden(false), [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const navContextValue = useMemo(
    () => ({
      openMobileNav,
      desktopSidebarHidden: desktopHidden,
      hideDesktopSidebar,
      showDesktopSidebar,
    }),
    [openMobileNav, desktopHidden, hideDesktopSidebar, showDesktopSidebar],
  )

  if (isAuthPathname(pathname)) {
    return <>{children}</>
  }

  return (
    <MobileNavProvider value={navContextValue}>
      <Box className={styles.shell}>
        <Sidebar
          brands={brands}
          role={role}
          variant="fixed"
          hidden={desktopHidden}
        />
        <Drawer
          anchor="left"
          open={mobileOpen}
          onClose={closeMobileNav}
          classes={{ paper: styles.mobileDrawerPaper }}
        >
          <Sidebar brands={brands} role={role} variant="drawer" />
        </Drawer>
        <Box component="main" className={styles.main}>
          {children}
        </Box>
      </Box>
    </MobileNavProvider>
  )
})
