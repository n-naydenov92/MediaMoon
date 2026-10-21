'use client'

import { memo } from 'react'
import Badge from '@mui/material/Badge'
import Button from '@mui/material/Button'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import styles from './FilterToggle.module.css'

interface Props {
  // Any applied filter (preset or custom rule) tints the toggle. Open/collapsed never
  // does — the chevron already shows that, and a tint without filters reads as "filtered".
  readonly filterCount: number
  readonly onClick: () => void
  readonly ariaLabel: string
  // Collapsed/desktop shows color only: the count is hidden because, with the chips
  // gone, a bare number reads as noise — the accent tint is the reminder that matters.
  readonly showCount?: boolean
  // 'up'/'down' renders the inline accordion chevron (desktop); omit it for the
  // mobile sheet trigger, where a chevron would wrongly imply inline expansion.
  readonly chevron?: 'up' | 'down'
}

export default memo(function FilterToggle({
  filterCount, onClick, ariaLabel, showCount = true, chevron,
}: Props): JSX.Element {
  const active = filterCount > 0

  return (
    <Button
      type="button"
      variant="text"
      color="inherit"
      onClick={onClick}
      className={styles.toggle}
      data-active={active ? 'true' : 'false'}
      aria-label={ariaLabel}
      aria-expanded={chevron ? chevron === 'up' : undefined}
    >
      <Badge
        color="primary"
        badgeContent={filterCount}
        invisible={!showCount || filterCount === 0}
        className={styles.badge}
      >
        <FilterAltOutlinedIcon className={styles.filterIcon} fontSize="small" />
      </Badge>
      {chevron === 'up' && <KeyboardArrowUpIcon fontSize="small" />}
      {chevron === 'down' && <KeyboardArrowDownIcon fontSize="small" />}
    </Button>
  )
})
