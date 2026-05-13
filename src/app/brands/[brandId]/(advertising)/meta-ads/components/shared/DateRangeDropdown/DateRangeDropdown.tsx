'use client'

import { useRef, useState } from 'react'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Switch from '@mui/material/Switch'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  type CustomRange,
  type DatePreset,
  type DateRangeSelection,
} from '@/lib/meta/dateRange'
import CalendarPicker from '../CalendarPicker/CalendarPicker'
import styles from './DateRangeDropdown.module.css'

interface Props {
  readonly value: DateRangeSelection
  readonly onPresetChange: (next: DatePreset) => void
  readonly onCustomRangeChange: (range: CustomRange) => void
  readonly comparisonEnabled: boolean
  readonly onComparisonChange: (next: boolean) => void
  readonly comparisonDisabled?: boolean
}

export default function DateRangeDropdown({
  value,
  onPresetChange,
  onCustomRangeChange,
  comparisonEnabled,
  onComparisonChange,
  comparisonDisabled = false,
}: Props): JSX.Element {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const calendarAnchorRef = useRef<HTMLLIElement | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const triggerLabel =
    value.kind === 'preset'
      ? DATE_PRESET_LABELS[value.preset]
      : `${formatHuman(value.range.from)} – ${formatHuman(value.range.to)}`

  function handlePresetClick(preset: DatePreset): void {
    onPresetChange(preset)
    setMenuOpen(false)
  }

  function handleApplyCustom(range: CustomRange): void {
    onCustomRangeChange(range)
    setCalendarOpen(false)
    setMenuOpen(false)
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="outlined"
        color="inherit"
        size="small"
        endIcon={<KeyboardArrowDownIcon />}
        onClick={() => setMenuOpen(true)}
        className={styles.trigger}
      >
        {triggerLabel}
      </Button>
      <Menu
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
        anchorEl={triggerRef.current}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { className: styles.menuPaper } }}
      >
        {DATE_PRESETS.map((preset, index) => {
          const items = [
            <MenuItem
              key={preset}
              dense
              selected={value.kind === 'preset' && preset === value.preset}
              onClick={() => handlePresetClick(preset)}
            >
              <ListItemText primary={DATE_PRESET_LABELS[preset]} />
            </MenuItem>,
          ]
          if (preset === 'last_7d') {
            items.push(<Divider key={`${preset}-divider`} className={styles.divider} />)
          }
          if (index === DATE_PRESETS.length - 1) {
            items.push(<Divider key="last-divider" className={styles.divider} />)
            items.push(
              <MenuItem
                key="custom"
                dense
                ref={calendarAnchorRef}
                selected={value.kind === 'custom'}
                onClick={() => setCalendarOpen(true)}
              >
                <ListItemText primary="Custom range…" />
              </MenuItem>,
            )
          }
          return items
        })}
        <Divider className={styles.divider} />
        <MenuItem
          dense
          disabled={comparisonDisabled}
          onClick={(event) => {
            event.preventDefault()
            if (comparisonDisabled) {
              return
            }
            onComparisonChange(!comparisonEnabled)
          }}
          className={styles.toggleItem}
        >
          <ListItemText primary="Compare to previous period" />
          <Switch
            edge="end"
            size="small"
            checked={comparisonEnabled}
            disabled={comparisonDisabled}
            onClick={(event) => event.stopPropagation()}
            onChange={(_event, checked) => onComparisonChange(checked)}
          />
        </MenuItem>
      </Menu>
      <Popover
        // eslint-disable-next-line react-hooks/refs -- MUI Popover/Menu anchorEl pattern needs ref.current after first render
        anchorEl={calendarAnchorRef.current}
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { className: styles.calendarPaper } }}
      >
        <CalendarPicker
          value={value.kind === 'custom' ? value.range : null}
          onApply={handleApplyCustom}
          onCancel={() => setCalendarOpen(false)}
        />
      </Popover>
    </>
  )
}

function formatHuman(iso: string): string {
  const parts = iso.split('-').map(Number)
  const [y, m, d] = [parts[0] ?? 1970, parts[1] ?? 1, parts[2] ?? 1]
  const date = new Date(Date.UTC(y, m - 1, d))
  const month = date.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
  return `${date.getUTCDate()} ${month}`
}
