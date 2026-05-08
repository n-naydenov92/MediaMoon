'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SearchIcon from '@mui/icons-material/Search'
import BenchmarkLegend from './BenchmarkLegend'
import { COLUMN_IDS, getColumnSpec, isColumnId, type ColumnId } from './columnSpecs'
import ColumnPicker from './ColumnPicker'
import type { SortSpec } from './sliceToFilters'
import styles from './Toolbar.module.css'

interface Props {
  readonly total: number
  readonly shown: number
  readonly sort: SortSpec
  readonly onSortChange: (sort: SortSpec) => void
  readonly visibleColumns: readonly ColumnId[]
  readonly onColumnsChange: (next: readonly ColumnId[]) => void
}

export default function Toolbar({
  total,
  shown,
  sort,
  onSortChange,
  visibleColumns,
  onColumnsChange,
}: Props): JSX.Element {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const sortableColumnId = isColumnId(sort.field) ? sort.field : null
  const sortLabel = sortableColumnId
    ? `${getColumnSpec(sortableColumnId).label} ${sort.direction === 'desc' ? '↓' : '↑'}`
    : `Spend ${sort.direction === 'desc' ? '↓' : '↑'}`

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return COLUMN_IDS
    }
    return COLUMN_IDS.filter((id) => getColumnSpec(id).label.toLowerCase().includes(q))
  }, [query])

  function handlePickField(field: ColumnId): void {
    if (sort.field === field) {
      onSortChange({ field, direction: sort.direction === 'desc' ? 'asc' : 'desc' })
    } else {
      onSortChange({ field, direction: 'desc' })
    }
    setOpen(false)
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    event.stopPropagation()
  }

  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" className={styles.root}>
      <Stack direction="row" alignItems="center" spacing={1} className={styles.left}>
        <Box component="span" className={styles.count}>
          {shown.toLocaleString('en-GB')} of {total.toLocaleString('en-GB')} ads
        </Box>
        <BenchmarkLegend />
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1} className={styles.right}>
        <Button
          ref={triggerRef}
          size="small"
          variant="outlined"
          color="inherit"
          endIcon={<KeyboardArrowDownIcon />}
          onClick={() => setOpen(true)}
          className={styles.sortBtn}
        >
          <Box component="span" className={styles.sortLabelMuted}>
            Sort:&nbsp;
          </Box>
          {sortLabel}
        </Button>
        <Menu
          anchorEl={triggerRef.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          slotProps={{ paper: { className: styles.menuPaper } }}
          MenuListProps={{ autoFocusItem: false, className: styles.menuList }}
        >
          <Box className={styles.searchBox}>
            <TextField
              autoFocus
              size="small"
              fullWidth
              placeholder="Search metric…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                className: styles.searchInput,
              }}
            />
          </Box>
          <Box className={styles.scrollArea}>
            {filteredIds.length === 0 && (
              <MenuItem disabled dense>
                <ListItemText primary="No matches" />
              </MenuItem>
            )}
            {filteredIds.map((id) => {
              const spec = getColumnSpec(id)
              const active = sort.field === id
              return (
                <MenuItem
                  key={id}
                  dense
                  selected={active}
                  onClick={() => handlePickField(id)}
                >
                  <ListItemText primary={spec.label} />
                  {active && (
                    <Box component="span" className={styles.sortDir} aria-hidden>
                      {sort.direction === 'desc' ? '↓' : '↑'}
                    </Box>
                  )}
                </MenuItem>
              )
            })}
          </Box>
        </Menu>
        <ColumnPicker visible={visibleColumns} onChange={onColumnsChange} />
      </Stack>
    </Stack>
  )
}
