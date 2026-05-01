'use client'

import { memo } from 'react'
import CheckIcon from '@mui/icons-material/Check'
import type { BrandConfig } from '@/types'
import { LABELS } from '@/components/layout/labels'
import { cssVars } from '@/lib/css'
import SidebarTooltip from '@/components/layout/ui/SidebarTooltip'
import styles from './BrandSwitcher.module.css'

const OVERVIEW_GLYPH = '◎'

interface Props {
  readonly brand: BrandConfig | null
  readonly isSelected: boolean
  readonly onSelect: () => void
}

const BrandMenuItem = memo(function BrandMenuItem({
  brand,
  isSelected,
  onSelect,
}: Props): JSX.Element {
  const glyph = brand?.emoji ?? OVERVIEW_GLYPH
  const label = brand?.label ?? LABELS.sidebar.overview
  const glyphStyle = brand ? cssVars({ '--brand-color': brand.color }) : undefined

  return (
    <li>
      <SidebarTooltip label={label} enabled>
        <button
          type="button"
          role="option"
          aria-selected={isSelected}
          className={styles.option}
          onClick={onSelect}
        >
          <span className={styles.optionGlyph} aria-hidden="true" style={glyphStyle}>
            {glyph}
          </span>
          <span className={styles.optionLabel}>{label}</span>
          {isSelected && (
            <CheckIcon className={styles.optionCheck} fontSize="small" />
          )}
        </button>
      </SidebarTooltip>
    </li>
  )
})

export default BrandMenuItem
