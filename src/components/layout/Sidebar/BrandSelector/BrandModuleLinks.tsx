'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import Stack from '@mui/material/Stack'
import type { ModuleConfig } from '@/types'
import ModuleLink from '@/components/layout/Sidebar/ModuleLink/ModuleLink'

interface Props {
  readonly brandId: string
  readonly modules: readonly ModuleConfig[]
}

export default memo(function BrandModuleLinks({ brandId, modules }: Props): JSX.Element {
  const pathname = usePathname()
  return (
    <Stack spacing={1} component="nav">
      {modules.map((m) => {
        const href = `/brands/${brandId}/${m.id}`
        const active = pathname?.startsWith(href) ?? false
        return <ModuleLink key={m.id} module={m} active={active} hrefOverride={href} />
      })}
    </Stack>
  )
})
