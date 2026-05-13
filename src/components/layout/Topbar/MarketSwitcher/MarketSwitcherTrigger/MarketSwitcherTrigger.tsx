'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import styles from '../MarketSwitcher.module.css'

interface Props {
  readonly label: string
  readonly menuId: string
  readonly isOpen: boolean
  readonly onToggle: () => void
}

export default memo(function MarketSwitcherTrigger({
  label,
  menuId,
  isOpen,
  onToggle,
}: Props): JSX.Element {
  return (
    <Box
      component="button"
      type="button"
      className={styles.trigger}
      onClick={onToggle}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-controls={menuId}
      aria-label={label}
    >
      <Box component="span" className={styles.label}>{label}</Box>
      <UnfoldMoreIcon className={styles.chevron} fontSize="small" />
    </Box>
  )
})
