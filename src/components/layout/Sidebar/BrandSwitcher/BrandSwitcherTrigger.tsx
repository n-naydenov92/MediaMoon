'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
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

export default memo(function BrandSwitcherTrigger({
  activeBrand,
  triggerLabel,
  menuId,
  isOpen,
  onToggle,
}: Props): JSX.Element {
  return (
    <SidebarTooltip label={triggerLabel} enabled={false}>
      <Box
        component="button"
        type="button"
        className={styles.trigger}
        onClick={onToggle}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={triggerLabel}
      >
        <Box
          component="span"
          className={styles.glyph}
          aria-hidden="true"
          data-color={activeBrand?.color ?? 'transparent'}
          style={activeBrand ? cssVars({ '--brand-color': activeBrand.color }) : undefined}
        >
          {activeBrand?.emoji ?? FALLBACK_GLYPH}
        </Box>
        <Box component="span" className={styles.label} title={triggerLabel}>
          {triggerLabel}
        </Box>
        <KeyboardArrowDownIcon className={styles.chevron} fontSize="small" />
      </Box>
    </SidebarTooltip>
  )
})
