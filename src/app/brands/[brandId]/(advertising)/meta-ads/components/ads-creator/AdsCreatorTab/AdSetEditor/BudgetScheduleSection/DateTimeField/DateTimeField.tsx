'use client'

import { memo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import 'react-day-picker/style.css'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import { combineDateAndTime, formatDateTimeDisplay, parseIsoSafe, pickHour, pickMinute } from './helpers'
import styles from './DateTimeField.module.css'

interface Props {
  readonly value: string
  readonly onChange: (nextIso: string) => void
  readonly disabled?: boolean
  readonly id: string
  readonly ariaLabel: string
}

export default memo(function DateTimeField({
  value,
  onChange,
  disabled,
  id,
  ariaLabel,
}: Props): JSX.Element {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const open = Boolean(anchor)

  const currentDate = parseIsoSafe(value)
  const hour = pickHour(currentDate)
  const minute = pickMinute(currentDate)

  const handleDaySelect = (day: Date | undefined): void => {
    if (!day) {
      return
    }
    onChange(combineDateAndTime(day, hour, minute))
  }

  const handleHourChange = (raw: string): void => {
    const next = parseInt(raw, 10)
    if (!Number.isFinite(next) || next < 0 || next > 23) {
      return
    }
    const base = currentDate ?? new Date()
    onChange(combineDateAndTime(base, next, minute))
  }

  const handleMinuteChange = (raw: string): void => {
    const next = parseInt(raw, 10)
    if (!Number.isFinite(next) || next < 0 || next > 59) {
      return
    }
    const base = currentDate ?? new Date()
    onChange(combineDateAndTime(base, hour, next))
  }

  return (
    <Box className={styles.root}>
      <TextField
        id={id}
        value={formatDateTimeDisplay(value)}
        placeholder="Pick a date and time"
        size="small"
        variant="outlined"
        fullWidth
        disabled={disabled}
        className="density-dialog"
        onClick={(e) => {
          if (!disabled) {
            setAnchor(e.currentTarget)
          }
        }}
        inputProps={{ 'aria-label': ariaLabel, readOnly: true }}
        // eslint-disable-next-line react/jsx-no-duplicate-props
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                disabled={disabled}
                aria-label="Open calendar"
                onClick={(e) => {
                  e.stopPropagation()
                  setAnchor(e.currentTarget)
                }}
              >
                <CalendarMonthOutlinedIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Popover
        open={open}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        classes={{ paper: styles.paper }}
      >
        <Box className={styles.body}>
          <DayPicker
            mode="single"
            selected={currentDate ?? undefined}
            onSelect={handleDaySelect}
            weekStartsOn={1}
            defaultMonth={currentDate ?? new Date()}
            showOutsideDays
          />

          <Box className={styles.timeRow}>
            <Typography component="span" variant="inherit" className={styles.timeLabel}>
              Time
            </Typography>
            <Box className={styles.timeInputs}>
              <TextField
                type="number"
                value={String(hour).padStart(2, '0')}
                onChange={(e) => handleHourChange(e.target.value)}
                size="small"
                variant="outlined"
                className="density-dialog"
                inputProps={{ min: 0, max: 23, 'aria-label': 'Hour' }}
              />
              <Typography component="span" variant="inherit" className={styles.timeSep}>
                :
              </Typography>
              <TextField
                type="number"
                value={String(minute).padStart(2, '0')}
                onChange={(e) => handleMinuteChange(e.target.value)}
                size="small"
                variant="outlined"
                className="density-dialog"
                inputProps={{ min: 0, max: 59, 'aria-label': 'Minute' }}
              />
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  )
})
