'use client'

import { memo, useCallback, useId, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { BrandConfig, ModuleConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import { getActiveModuleId, resolveActiveBrand } from '@/lib/navigation'
import { flattenModules, getFirstNavigableModule } from '@/config/modules'
import BrandSwitcherTrigger from './BrandSwitcherTrigger'
import BrandMenu from './BrandMenu'
import { useDismissPopover } from '@/components/layout/hooks/useDismissPopover'
import styles from './BrandSwitcher.module.css'

interface Props {
  readonly brands: readonly BrandConfig[]
  readonly modules: readonly ModuleConfig[]
  readonly isCollapsed: boolean
}

export default memo(function BrandSwitcher({
  brands,
  modules,
  isCollapsed,
}: Props): JSX.Element {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  const activeBrand = resolveActiveBrand(pathname, brands)
  const triggerLabel = activeBrand?.label ?? LABELS.sidebar.overview
  const currentModuleId = getActiveModuleId(pathname)
  const queryString = searchParams?.toString() ?? ''

  const dismiss = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleOpen = useCallback(() => {
    setIsOpen((s) => !s)
  }, [])

  const navigateToBrand = useCallback(
    (brandId: string | null): void => {
      setIsOpen(false)
      if (brandId === null) {
        router.push('/brands')
        return
      }
      const preserved = flattenModules(modules).find(
        (m) => m.id === currentModuleId && m.path,
      )
      const target = preserved ?? getFirstNavigableModule(modules)
      const suffix = queryString ? `?${queryString}` : ''
      if (target) {
        router.push(`/brands/${brandId}/${target.id}${suffix}`)
        return
      }
      router.push(`/brands/${brandId}`)
    },
    [currentModuleId, modules, queryString, router],
  )

  useDismissPopover(rootRef, isOpen, dismiss)

  return (
    <div className={styles.root} ref={rootRef}>
      <BrandSwitcherTrigger
        activeBrand={activeBrand}
        triggerLabel={triggerLabel}
        menuId={menuId}
        isCollapsed={isCollapsed}
        isOpen={isOpen}
        onToggle={toggleOpen}
      />

      {isOpen && (
        <BrandMenu
          id={menuId}
          brands={brands}
          activeBrand={activeBrand}
          onSelect={navigateToBrand}
        />
      )}
    </div>
  )
})
