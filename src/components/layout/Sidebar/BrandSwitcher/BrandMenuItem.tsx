'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
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

function BrandMenuItem({
  brand,
  isSelected,
  onSelect,
}: Props): JSX.Element {
  const glyph = brand?.emoji ?? OVERVIEW_GLYPH
  const label = brand?.label ?? LABELS.sidebar.overview

  return (
    <Box component="li">
      <SidebarTooltip label={label} enabled>
        <Box
          component="button"
          type="button"
          role="option"
          aria-selected={isSelected}
          className={styles.option}
          onClick={onSelect}
        >
          <Box
            component="span"
            className={styles.optionGlyph}
            aria-hidden="true"
            style={brand ? cssVars({ '--brand-color': brand.color }) : undefined}
          >
            {glyph}
          </Box>
          <Box component="span" className={styles.optionLabel}>
            {label}
          </Box>
          {isSelected && (
            <CheckIcon className={styles.optionCheck} fontSize="small" />
          )}
        </Box>
      </SidebarTooltip>
    </Box>
  )
}

export default memo(BrandMenuItem)
