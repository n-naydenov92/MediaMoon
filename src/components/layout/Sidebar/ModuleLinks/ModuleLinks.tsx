'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import Stack from '@mui/material/Stack'
import type { ModuleConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import ModuleLink from '@/components/layout/Sidebar/ModuleLink/ModuleLink'

interface Props {
  readonly modules: readonly ModuleConfig[]
}

/**
 * Vertical navigation list rendering one ModuleLink per registered module.
 * Derives the active state by comparing the current pathname to each module path.
 */
export default memo(function ModuleLinks({ modules }: Props): JSX.Element {
  const pathname = usePathname()
  return (
    <Stack spacing={1} component="nav" aria-label={LABELS.sidebar.navAriaLabel}>
      {modules.map((m) => {
        const active = pathname?.startsWith(m.path) ?? false
        return <ModuleLink key={m.id} module={m} active={active} />
      })}
    </Stack>
  )
})
