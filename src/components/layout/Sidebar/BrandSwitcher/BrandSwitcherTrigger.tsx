'use client'

import { memo } from 'react'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import type { BrandConfig } from '@/types'
import { cssVars } from '@/lib/css'
import SidebarTooltip from '@/components/layout/ui/SidebarTooltip'
import styles from './BrandSwitcher.module.css'

const FALLBACK_GLYPH = '◎'

interface Props {
  readonly activeBrand: BrandConfig | null
  readonly triggerLabel: string
  readonly menuId: string
  readonly isOpen: boolean
  readonly onToggle: () => void
}

const BrandSwitcherTrigger = memo(function BrandSwitcherTrigger({
  activeBrand,
  triggerLabel,
  menuId,
  isOpen,
  onToggle,
}: Props): JSX.Element {
  const glyphStyle = activeBrand
    ? cssVars({ '--brand-color': activeBrand.color })
    : undefined

  return (
    <SidebarTooltip label={triggerLabel} enabled={false}>
      <button
        type="button"
        className={styles.trigger}
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
        <span className={styles.label} title={triggerLabel}>
          {triggerLabel}
        </span>
        <KeyboardArrowDownIcon className={styles.chevron} fontSize="small" />
      </button>
    </SidebarTooltip>
  )
})

export default BrandSwitcherTrigger
