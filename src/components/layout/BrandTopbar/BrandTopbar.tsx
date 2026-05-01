'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import Topbar from '@/components/layout/Topbar/Topbar'
import MarketSwitcher from '@/components/layout/Topbar/MarketSwitcher/MarketSwitcher'
import TopbarOverflowMenu from '@/components/layout/Topbar/TopbarOverflowMenu/TopbarOverflowMenu'
import { findModuleById } from '@/config/modules'
import { extractModuleId } from './helpers'

const BrandTopbar = memo(function BrandTopbar(): JSX.Element {
  const pathname = usePathname()
  const moduleId = extractModuleId(pathname)
  const module = moduleId ? findModuleById(moduleId) : null
  const title = module?.label ?? ''

  return (
    <Topbar
      title={title}
      leftSlot={<MarketSwitcher />}
      rightSlot={<TopbarOverflowMenu />}
    />
  )
})

export default BrandTopbar
