'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import CheckIcon from '@mui/icons-material/Check'
import type { MarketSelection } from '@/lib/markets'
import styles from '../MarketSwitcher.module.css'

interface Props {
  readonly value: MarketSelection
  readonly label: string
  readonly isSelected: boolean
  readonly onSelect: (value: MarketSelection) => void
}

export default memo(function MarketMenuItem({ value, label, isSelected, onSelect }: Props): JSX.Element {
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
})
