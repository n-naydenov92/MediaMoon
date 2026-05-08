'use client'

import { useState } from 'react'
import { DayPicker, type DateRange } from 'react-day-picker'
import 'react-day-picker/style.css'
import Button from '@mui/material/Button'
import type { CustomRange } from '@/lib/meta/dateRange'
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
    <div className={styles.root}>
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
      <div className={styles.footer}>
        <span className={styles.range}>
          {range?.from ? formatHuman(range.from) : 'Start date'}
          {' — '}
          {range?.to ? formatHuman(range.to) : 'End date'}
        </span>
        <div className={styles.actions}>
          <Button onClick={onCancel} color="inherit" size="small">
            Cancel
          </Button>
          <Button onClick={handleApply} variant="contained" size="small" disabled={!canApply}>
            Apply
          </Button>
        </div>
      </div>
    </div>
  )
}

function startOfUtcDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseIso(value: string): Date {
  const parts = value.split('-').map(Number)
  const [y, m, day] = [parts[0] ?? 1970, parts[1] ?? 1, parts[2] ?? 1]
  return new Date(y, m - 1, day)
}

function formatHuman(d: Date): string {
  const month = d.toLocaleString('en-GB', { month: 'short' })
  return `${d.getDate()} ${month} ${d.getFullYear()}`
}
