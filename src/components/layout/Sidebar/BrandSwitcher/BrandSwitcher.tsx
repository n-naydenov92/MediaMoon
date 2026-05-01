'use client'

import { memo, useCallback, useId, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { BrandConfig, ModuleConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import { resolveActiveBrand } from '@/lib/navigation'
import { getFirstNavigableModule } from '@/config/modules'
import BrandSwitcherTrigger from './BrandSwitcherTrigger'
import BrandMenu from './BrandMenu'
import { useDismissPopover } from './useDismissPopover'
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
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const menuId = useId()

  const activeBrand = resolveActiveBrand(pathname, brands)
  const triggerLabel = activeBrand?.label ?? LABELS.sidebar.overview

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
      const firstModule = getFirstNavigableModule(modules)
      if (firstModule) {
        router.push(`/brands/${brandId}/${firstModule.id}`)
        return
      }
      router.push(`/brands/${brandId}`)
    },
    [modules, router],
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
