'use client'

import { memo, useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { BrandConfig, ModuleConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import { getActiveBrandId } from '@/lib/navigation'
import { useThemeMode } from '@/styles/useThemeMode'
import BrandSwitcher from '@/components/layout/Sidebar/BrandSwitcher/BrandSwitcher'
import SidebarSearch from '@/components/layout/Sidebar/SidebarSearch/SidebarSearch'
import ModuleNavigation from '@/components/layout/Sidebar/ModuleNavigation/ModuleNavigation'
import SidebarUserCard from '@/components/layout/Sidebar/SidebarUserCard/SidebarUserCard'
import styles from './Sidebar.module.css'

interface Props {
  readonly modules: readonly ModuleConfig[]
  readonly brands: readonly BrandConfig[]
  readonly variant?: 'fixed' | 'drawer'
}

export default memo(function Sidebar({ modules, brands, variant = 'fixed' }: Props): JSX.Element {
  const pathname = usePathname()
  const { mode } = useThemeMode()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const brandId = getActiveBrandId(pathname)

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((s) => !s)
  }, [])

  return (
    <aside
      className={styles.root}
      data-collapsed={isCollapsed}
      data-variant={variant}
      data-theme={mode}
      aria-label={LABELS.sidebar.primaryNavAriaLabel}
    >
      <div className={styles.brandSection}>
        <BrandSwitcher
          brands={brands}
          modules={modules}
          isCollapsed={isCollapsed}
        />
      </div>

      {!isCollapsed && (
        <div className={styles.searchSlot}>
          <SidebarSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
      )}

      <ModuleNavigation
        modules={modules}
        brandId={brandId}
        searchQuery={searchQuery}
        isCollapsed={isCollapsed}
      />

      <SidebarUserCard
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapse}
        showCollapseToggle={variant === 'fixed'}
      />
    </aside>
  )
})
