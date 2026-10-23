'use client'

import { useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import type { CustomRange } from '@/lib/meta/dateRange'
import { formatHuman, isoOf, parseIso, startOfUtcDay } from './helpers'
import styles from './CalendarPicker.module.css'

interface Props {
  readonly value: CustomRange | null
  readonly onApply: (range: CustomRange) => void
  readonly onCancel: () => void
}

export default function CalendarPicker({ value, onApply, onCancel }: Props): JSX.Element {
  const today = startOfUtcDay(new Date())
  const initialRange: DateRange | undefined = value
    ? { from: parseIso(value.from), to: parseIso(value.to) }
    : undefined
  const [range, setRange] = useState<DateRange | undefined>(initialRange)

  const canApply = Boolean(range?.from && range?.to)

  function handleApply(): void {
    if (!range?.from || !range?.to) {
      return
    }
    onApply({ from: isoOf(range.from), to: isoOf(range.to) })
  }

  return (
    <Box className={styles.root}>
      <DayPicker
        mode="range"
        selected={range}
        onSelect={setRange}
        numberOfMonths={2}
        disabled={{ after: today }}
        weekStartsOn={1}
        defaultMonth={range?.from ?? today}
        showOutsideDays
      />
      <Box className={styles.footer}>
        <Typography component="span" variant="inherit" className={styles.range}>
          {range?.from ? formatHuman(range.from) : 'Start date'}
          {' — '}
          {range?.to ? formatHuman(range.to) : 'End date'}
        </Typography>
        <Box className={styles.actions}>
          <Button onClick={onCancel} color="inherit" size="small">
            Cancel
          </Button>
          <Button onClick={handleApply} variant="contained" size="small" disabled={!canApply}>
            Apply
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
