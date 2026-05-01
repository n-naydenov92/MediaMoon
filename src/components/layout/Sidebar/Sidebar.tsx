'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Drawer from '@mui/material/Drawer'
import Stack from '@mui/material/Stack'
import type { BrandConfig, ModuleConfig } from '@/types'
import Logo from '@/components/layout/Sidebar/Logo/Logo'
import BrandSelector from '@/components/layout/Sidebar/BrandSelector/BrandSelector'
import SidebarFooter from '@/components/layout/Sidebar/SidebarFooter/SidebarFooter'
import styles from './Sidebar.module.css'

const SIDEBAR_WIDTH = 240

interface Props {
  readonly modules: readonly ModuleConfig[]
  readonly brands: readonly BrandConfig[]
}

/**
 * Persistent left-hand navigation drawer.
 * Hidden on mobile (xs), visible from md breakpoint upward.
 */
export default memo(function Sidebar({ modules, brands }: Props): JSX.Element {
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
        <BrandSelector brands={brands} modules={modules} />
        <Box sx={{ flex: 1 }} />
        <SidebarFooter />
      </Stack>
    </Drawer>
  )
})
