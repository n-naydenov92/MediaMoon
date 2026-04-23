'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Stack from '@mui/material/Stack'
import type { ModuleConfig } from '@/types'
import Logo from '@/components/layout/Sidebar/Logo/Logo'
import ModuleLinks from '@/components/layout/Sidebar/ModuleLinks/ModuleLinks'
import SidebarFooter from '@/components/layout/Sidebar/SidebarFooter/SidebarFooter'
import styles from './Sidebar.module.css'

const SIDEBAR_WIDTH = 220

interface Props {
  readonly modules: readonly ModuleConfig[]
}

/**
 * Persistent left-hand navigation drawer.
 * Hidden on mobile (xs), visible from md breakpoint upward.
 */
export default memo(function Sidebar({ modules }: Props): JSX.Element {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        display: { xs: 'none', md: 'block' },
        '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Stack className={styles.inner} spacing={6} sx={{ p: 4 }}>
        <Logo />
        <ModuleLinks modules={modules} />
        <Box sx={{ flex: 1 }} />
        <SidebarFooter />
      </Stack>
    </Drawer>
  )
})
