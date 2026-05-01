'use client'

import { memo } from 'react'
import { usePathname } from 'next/navigation'
import type { ModuleConfig } from '@/types'
import ModuleNavigationGroup from './ModuleNavigationGroup'
import ModuleNavigationLeaf from './ModuleNavigationLeaf'

interface Props {
  readonly module: ModuleConfig
  readonly brandId: string | null
  readonly isCollapsed: boolean
  readonly forceExpanded?: boolean
}

/**
 * Dispatcher: a module with children renders an expandable group;
 * any other module renders a navigable leaf link.
 */
export default memo(function ModuleNavigationItem({
  module: mod,
  brandId,
  isCollapsed,
  forceExpanded = false,
}: Props): JSX.Element {
  const pathname = usePathname()
  const hasChildren = (mod.children?.length ?? 0) > 0

  if (hasChildren) {
    return (
      <ModuleNavigationGroup
        module={mod}
        brandId={brandId}
        isCollapsed={isCollapsed}
        forceExpanded={forceExpanded}
      />
    )
  }

  return (
    <ModuleNavigationLeaf
      module={mod}
      brandId={brandId}
      pathname={pathname}
      isCollapsed={isCollapsed}
    />
  )
})
