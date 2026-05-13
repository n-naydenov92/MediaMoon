'use client'

import { memo, useCallback, useId, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import type { BrandConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import { resolveActiveBrand } from '@/lib/navigation'
import { useDismissPopover } from '@/components/layout/hooks/useDismissPopover'
import BrandSwitcherTrigger from './BrandSwitcherTrigger'
import BrandMenu from './BrandMenu'
import styles from './BrandSwitcher.module.css'

interface Props {
  readonly brands: readonly BrandConfig[]
}

function BrandSwitcher({ brands }: Props): JSX.Element {
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
      const liveQuery =
        typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : ''
      const suffix = liveQuery ? `?${liveQuery}` : ''
      if (brandId === null) {
        router.push(`/brands${suffix}`)
        return
      }
      const tailMatch = pathname?.match(/^\/brands\/[^/]+(\/.*)?$/)
      const tail = tailMatch?.[1] ?? ''
      if (tail) {
        router.push(`/brands/${brandId}${tail}${suffix}`)
        return
      }
      router.push(`/brands/${brandId}${suffix}`)
    },
    [pathname, router],
  )

  useDismissPopover(rootRef, isOpen, dismiss)

  return (
    <Box className={styles.root} ref={rootRef}>
      <BrandSwitcherTrigger
        activeBrand={activeBrand}
        triggerLabel={triggerLabel}
        menuId={menuId}
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
    </Box>
  )
}

export default memo(BrandSwitcher)
