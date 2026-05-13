'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import CheckIcon from '@mui/icons-material/Check'
import type { MarketSelection } from '@/lib/markets'
import { MARKET_LABELS } from '@/lib/marketLabels'
import styles from './MarketSwitcher.module.css'

interface Props {
  readonly value: MarketSelection
  readonly isSelected: boolean
  readonly onSelect: (value: MarketSelection) => void
}

function MarketMenuItem({ value, isSelected, onSelect }: Props): JSX.Element {
  const label = MARKET_LABELS[value]

  return (
    <Box component="li">
      <Box
        component="button"
        type="button"
        role="option"
        aria-selected={isSelected}
        className={styles.option}
        onClick={() => onSelect(value)}
      >
        <Box component="span" className={styles.optionLabel}>{label}</Box>
        {isSelected && <CheckIcon className={styles.optionCheck} fontSize="small" />}
      </Box>
    </Box>
  )
}

export default memo(MarketMenuItem)
