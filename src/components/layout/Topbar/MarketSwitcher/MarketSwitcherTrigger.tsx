'use client'

import { memo } from 'react'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import styles from './MarketSwitcher.module.css'

interface Props {
  readonly label: string
  readonly menuId: string
  readonly isOpen: boolean
  readonly onToggle: () => void
}

const MarketSwitcherTrigger = memo(function MarketSwitcherTrigger({
  label,
  menuId,
  isOpen,
  onToggle,
}: Props): JSX.Element {
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={onToggle}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={menuId}
      aria-label={label}
    >
      <span className={styles.label}>{label}</span>
      <UnfoldMoreIcon className={styles.chevron} fontSize="small" />
    </button>
  )
})

export default MarketSwitcherTrigger
