'use client'

import { memo } from 'react'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import styles from './FilterToggle.module.css'

interface Props {
  readonly filterCount: number
  readonly onClick: () => void
  readonly ariaLabel: string
  // 'up'/'down' renders the inline accordion chevron (desktop); omit it for the
  // mobile sheet trigger, where a chevron would wrongly imply inline expansion.
  readonly chevron?: 'up' | 'down'
}

export default memo(function FilterToggle({ filterCount, onClick, ariaLabel, chevron }: Props): JSX.Element {
  const hasFilters = filterCount > 0
  return (
    <Button
      type="button"
      variant="text"
      color="inherit"
      onClick={onClick}
      className={styles.toggle}
      data-active={hasFilters ? 'true' : 'false'}
      aria-label={ariaLabel}
      aria-expanded={chevron ? chevron === 'up' : undefined}
    >
      <Badge
        color="primary"
        badgeContent={filterCount}
        invisible={!hasFilters}
        className={styles.badge}
      >
        <FilterAltOutlinedIcon className={styles.filterIcon} fontSize="small" />
      </Badge>
      {chevron === 'up' && <KeyboardArrowUpIcon fontSize="small" />}
      {chevron === 'down' && <KeyboardArrowDownIcon fontSize="small" />}
    </Button>
  )
})
