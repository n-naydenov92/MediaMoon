'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import Box from '@mui/material/Box'
import { MAIN_PANEL, findActivePanelPath, findPanelByTrail } from '@/config/sidebarNav'
import type { UserRole } from '@/types'
import NavPanelView from './NavPanelView'
import styles from './SidebarNav.module.css'

interface Props {
  readonly brandId: string | null
  readonly role: UserRole
}

export default memo(function SidebarNav({ brandId, role }: Props): JSX.Element {
  const pathname = usePathname()
  const [drillTrail, setDrillTrail] = useState<readonly string[]>([])

  const routeTrail = useMemo(
    () => findActivePanelPath(pathname ?? '', brandId),
    [pathname, brandId],
  )

  useEffect(() => {
    if (routeTrail.length > 0) {
      setDrillTrail(routeTrail)
    }
  }, [routeTrail])

  const activePanel = useMemo(
    () => findPanelByTrail(drillTrail) ?? MAIN_PANEL,
    [drillTrail],
  )

  const handleDrillInto = useCallback((itemId: string) => {
    setDrillTrail((prev) => [...prev, itemId])
  }, [])

  const handleBack = useCallback(() => {
    setDrillTrail((prev) => prev.slice(0, -1))
  }, [])

  const isMainPanel = drillTrail.length === 0

  return (
    <Box className={styles.root}>
      <NavPanelView
        panel={activePanel}
        brandId={brandId}
        role={role}
        pathname={pathname ?? ''}
        showBackButton={!isMainPanel}
        onBack={handleBack}
        onDrillInto={handleDrillInto}
      />
    </Box>
  )
})
