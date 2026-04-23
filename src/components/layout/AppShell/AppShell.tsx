'use client'

import { memo } from 'react'
import type { ReactNode } from 'react'
import Box from '@mui/material/Box'
import Sidebar from '@/components/layout/Sidebar/Sidebar'
import type { ModuleConfig } from '@/types'
import styles from './AppShell.module.css'

interface Props {
  readonly modules: readonly ModuleConfig[]
  readonly children: ReactNode
}

/**
 * Root application shell composing the persistent sidebar and main content area.
 */
export default memo(function AppShell({ modules, children }: Props): JSX.Element {
  return (
    <Box className={styles.shell}>
      <Sidebar modules={modules} />
      <Box component="main" className={styles.main}>
        {children}
      </Box>
    </Box>
  )
})
