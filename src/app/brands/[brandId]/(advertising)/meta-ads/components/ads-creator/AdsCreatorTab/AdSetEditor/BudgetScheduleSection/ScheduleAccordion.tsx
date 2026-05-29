'use client'

import { memo, useState } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import DateTimeField from '../DateTimeField/DateTimeField'
import { summarizeSchedule } from './helpers'
import styles from './ScheduleAccordion.module.css'

interface Props {
  readonly startTime: string
  readonly endTime: string
  readonly onStartTimeChange: (nextIso: string) => void
  readonly onEndTimeChange: (nextIso: string) => void
  readonly disabled: boolean
}

export default memo(function ScheduleAccordion({
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  disabled,
}: Props): JSX.Element {
  const [open, setOpen] = useState<boolean>(false)
  const summary = summarizeSchedule(startTime, endTime)

  return (
    <Box className={styles.root}>
      <Box
        component="button"
        type="button"
        className={styles.toggle}
        onClick={() => setOpen((prev) => !prev)}
        disabled={disabled}
        aria-expanded={open}
      >
        <Typography component="span" variant="inherit" className={styles.title}>
          {open ? 'Hide schedule' : 'Show schedule'}
        </Typography>
        <ExpandMoreOutlinedIcon
          className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}
          fontSize="small"
        />
        {!open && (
          <Typography component="span" variant="inherit" className={styles.summary}>
            {summary}
          </Typography>
        )}
      </Box>

      <Collapse in={open} timeout={200} unmountOnExit>
        <Box className={styles.fields}>
          <Box className={styles.field}>
            <Typography
              component="label"
              variant="inherit"
              className={styles.label}
              htmlFor="ad-set-editor-start"
            >
              Start date
            </Typography>
            <DateTimeField
              id="ad-set-editor-start"
              value={startTime}
              onChange={onStartTimeChange}
              disabled={disabled}
              ariaLabel="Start date and time"
            />
          </Box>

          <Box className={styles.field}>
            <Typography
              component="label"
              variant="inherit"
              className={styles.label}
              htmlFor="ad-set-editor-end"
            >
              End date (optional)
            </Typography>
            <DateTimeField
              id="ad-set-editor-end"
              value={endTime}
              onChange={onEndTimeChange}
              disabled={disabled}
              ariaLabel="End date and time"
            />
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
})
