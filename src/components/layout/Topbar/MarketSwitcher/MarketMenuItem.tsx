'use client'

import { memo } from 'react'
import CheckIcon from '@mui/icons-material/Check'
import type { MarketSelection } from '@/lib/markets'
import { MARKET_LABELS } from '@/lib/marketLabels'
import styles from './MarketSwitcher.module.css'

interface Props {
  readonly value: MarketSelection
  readonly isSelected: boolean
  readonly onSelect: (value: MarketSelection) => void
}

const MarketMenuItem = memo(function MarketMenuItem({
  value,
  isSelected,
  onSelect,
}: Props): JSX.Element {
  const label = MARKET_LABELS[value]

  return (
    <li>
      <button
        type="button"
        role="option"
        aria-selected={isSelected}
        className={styles.option}
        onClick={() => onSelect(value)}
      >
        <span className={styles.optionLabel}>{label}</span>
        {isSelected && <CheckIcon className={styles.optionCheck} fontSize="small" />}
      </button>
    </li>
  )
})

export default MarketMenuItem
