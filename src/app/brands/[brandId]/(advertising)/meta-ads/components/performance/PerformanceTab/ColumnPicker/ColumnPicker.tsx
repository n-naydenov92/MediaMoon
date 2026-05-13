'use client'

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import InputAdornment from '@mui/material/InputAdornment'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import SearchIcon from '@mui/icons-material/Search'
import { COLUMN_IDS, getColumnSpec, type ColumnId } from '../../columnSpecs'
import styles from './ColumnPicker.module.css'

interface Props {
  readonly visible: readonly ColumnId[]
  readonly onChange: (next: readonly ColumnId[]) => void
}

export default function ColumnPicker({ visible, onChange }: Props): JSX.Element {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const visibleSet = new Set(visible)

  useEffect(() => {
    if (!open) {
      setQuery('')
    }
  }, [open])

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) {
      return COLUMN_IDS
    }
    return COLUMN_IDS.filter((id) => getColumnSpec(id).label.toLowerCase().includes(q))
  }, [query])

  function toggle(id: ColumnId): void {
    const set = new Set(visible)
    if (set.has(id)) {
      set.delete(id)
    } else {
      set.add(id)
    }
    onChange(COLUMN_IDS.filter((c) => set.has(c)))
  }

  function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>): void {
    event.stopPropagation()
  }

  return (
    <>
      <Button
        ref={triggerRef}
        size="small"
        variant="outlined"
        color="inherit"
        endIcon={<KeyboardArrowDownIcon />}
        onClick={() => setOpen(true)}
        className={styles.trigger}
      >
        Columns
      </Button>
      <Menu
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
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
            placeholder="Search column…"
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
            const checked = visibleSet.has(id)
            return (
              <MenuItem key={id} dense onClick={() => toggle(id)}>
                <ListItemIcon className={styles.checkboxSlot}>
                  <Checkbox edge="start" checked={checked} tabIndex={-1} disableRipple size="small" />
                </ListItemIcon>
                <ListItemText primary={spec.label} />
              </MenuItem>
            )
          })}
        </Box>
      </Menu>
    </>
  )
}
