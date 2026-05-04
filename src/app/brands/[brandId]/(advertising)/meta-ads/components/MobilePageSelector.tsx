'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import type { BrandId } from '@/config/brands'
import styles from './MobilePageSelector.module.css'

interface PageOption {
  readonly slug: string
  readonly label: string
}

interface Props {
  readonly brandId: BrandId
  readonly options: readonly [PageOption, ...PageOption[]]
}

export default function MobilePageSelector({ brandId, options }: Props): JSX.Element {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement | null>(null)

  const activeOption: PageOption = options.find((opt) => {
    const href = `/brands/${brandId}/meta-ads/${opt.slug}`
    return pathname === href || pathname.startsWith(`${href}/`)
  }) ?? options[0]

  const handleSelect = useCallback(
    (slug: string) => {
      setIsOpen(false)
      router.push(`/brands/${brandId}/meta-ads/${slug}`)
    },
    [brandId, router],
  )

  const handleToggle = useCallback(() => setIsOpen((s) => !s), [])

  useEffect(() => {
    if (!isOpen) {
      return
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen])

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={handleToggle}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className={styles.label}>{activeOption.label}</span>
        <KeyboardArrowDownIcon fontSize="small" className={styles.chevron} />
      </button>
      {isOpen && (
        <ul className={styles.menu} role="menu">
          {options.map((opt) => {
            const isActive = opt.slug === activeOption.slug
            return (
              <li key={opt.slug} role="none">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.option}
                  data-active={isActive ? 'true' : 'false'}
                  onClick={() => handleSelect(opt.slug)}
                >
                  {opt.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
