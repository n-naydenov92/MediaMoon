'use client'

import { memo } from 'react'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import type { BrandConfig } from '@/types'
import { cssVars } from '@/lib/css'
import styles from './BrandSwitcher.module.css'

const FALLBACK_GLYPH = '◎'

interface Props {
  readonly activeBrand: BrandConfig | null
  readonly triggerLabel: string
  readonly menuId: string
  readonly isCollapsed: boolean
  readonly isOpen: boolean
  readonly onToggle: () => void
}

const BrandSwitcherTrigger = memo(function BrandSwitcherTrigger({
  activeBrand,
  triggerLabel,
  menuId,
  isCollapsed,
  isOpen,
  onToggle,
}: Props): JSX.Element {
  const glyphStyle = activeBrand
    ? cssVars({ '--brand-color': activeBrand.color })
    : undefined

  return (
    <button
      type="button"
      className={styles.trigger}
      data-collapsed={isCollapsed}
      onClick={onToggle}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={menuId}
      aria-label={triggerLabel}
    >
      <span
        className={styles.glyph}
        aria-hidden="true"
        data-color={activeBrand?.color ?? 'transparent'}
        style={glyphStyle}
      >
        {activeBrand?.emoji ?? FALLBACK_GLYPH}
      </span>
      {!isCollapsed && (
        <>
          <span className={styles.label} title={triggerLabel}>
            {triggerLabel}
          </span>
          <KeyboardArrowDownIcon className={styles.chevron} fontSize="small" />
        </>
      )}
    </button>
  )
})

export default BrandSwitcherTrigger
