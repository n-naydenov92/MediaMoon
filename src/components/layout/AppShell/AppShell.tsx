'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'
import Sidebar from '@/components/layout/Sidebar/Sidebar'
import type { BrandConfig, ModuleConfig } from '@/types'
import styles from './AppShell.module.css'

interface Props {
  readonly modules: readonly ModuleConfig[]
  readonly brands: readonly BrandConfig[]
  readonly children: ReactNode
}

const AUTH_ROUTE_PREFIXES = ['/sign-in', '/sign-up', '/sso-callback'] as const

function isAuthPathname(pathname: string | null): boolean {
  if (pathname === null) {
    return false
  }
  return AUTH_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export default memo(function AppShell({ modules, brands, children }: Props): JSX.Element {
  const pathname = usePathname()

  if (isAuthPathname(pathname)) {
    return <>{children}</>
  }

  return (
    <Box className={styles.shell}>
      <Sidebar modules={modules} brands={brands} />
      <Box component="main" className={styles.main}>
        {children}
      </Box>
    </Box>
  )
})
