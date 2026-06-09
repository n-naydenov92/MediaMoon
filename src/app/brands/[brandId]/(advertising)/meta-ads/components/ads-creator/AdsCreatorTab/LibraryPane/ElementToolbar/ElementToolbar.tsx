'use client'

import { memo, useRef, useState, type ReactNode } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import DebouncedSearchInput from '@/components/ui/DebouncedSearchInput/DebouncedSearchInput'
import type { SortDirection, SortFieldDef, SortFieldId } from '../config'
import styles from './ElementToolbar.module.css'

interface Props {
  readonly shown: number
  readonly total: number
  readonly hasMore: boolean
  readonly noun: string
  readonly searchPlaceholder: string
  readonly sortField: SortFieldId
  readonly sortDirection: SortDirection
  readonly sortFields: readonly SortFieldDef[]
  readonly onSortChange: (field: SortFieldId) => void
  readonly onSearchChange: (value: string) => void
  // Sort lives in the bottom sheet on mobile, so it can be hidden here.
  readonly showSort?: boolean
  // The mobile filter-sheet trigger; rendered only when provided (mobile).
  readonly filterTrigger?: ReactNode
}

export default memo(function ElementToolbar({
  shown,
  total,
  hasMore,
  noun,
  searchPlaceholder,
  sortField,
  sortDirection,
  sortFields,
  onSortChange,
  onSearchChange,
  showSort = true,
  filterTrigger,
}: Props): JSX.Element {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)

  const activeLabel = sortFields.find((f) => f.id === sortField)?.label ?? sortFields[0]?.label ?? ''
  const arrow = sortDirection === 'desc' ? '↓' : '↑'

  function handlePick(field: SortFieldId): void {
    onSortChange(field)
    setOpen(false)
  }

  return (
    <Box className={styles.root}>
      <Box component="span" className={styles.count}>
        {shown.toLocaleString('en-GB')} of {total.toLocaleString('en-GB')}
        {hasMore ? '+' : ''} {noun}
      </Box>
      <DebouncedSearchInput
        placeholder={searchPlaceholder}
        onDebouncedChange={onSearchChange}
        className={styles.search}
      />
      {showSort && (
        <>
          <Button
            ref={triggerRef}
            size="small"
            variant="outlined"
            color="inherit"
            endIcon={<KeyboardArrowDownIcon />}
            onClick={() => setOpen(true)}
            className={styles.sortBtn}
          >
            <Box component="span" className={styles.sortLabelMuted}>Sort:&nbsp;</Box>
            {`${activeLabel} ${arrow}`}
          </Button>
          <Menu
            anchorEl={triggerRef.current}
            open={open}
            onClose={() => setOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            {sortFields.map((field) => (
              <MenuItem
                key={field.id}
                dense
                selected={field.id === sortField}
                onClick={() => handlePick(field.id)}
              >
                <ListItemText primary={field.label} />
                {field.id === sortField && (
                  <Box component="span" className={styles.dirArrow}>
                    {arrow}
                  </Box>
                )}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
      {filterTrigger && <Box className={styles.triggerSlot}>{filterTrigger}</Box>}
    </Box>
  )
})
