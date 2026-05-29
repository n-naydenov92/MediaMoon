'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import AccordionToggle from '../AccordionToggle/AccordionToggle'
import FieldLabel from '../FieldLabel/FieldLabel'
import DateTimeField from './DateTimeField/DateTimeField'
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
  return (
    <AccordionToggle
      closedLabel="Show schedule"
      openLabel="Hide schedule"
      summary={summarizeSchedule(startTime, endTime)}
      disabled={disabled}
    >
      <Box className={styles.fields}>
        <Box className={styles.field}>
          <FieldLabel htmlFor="ad-set-editor-start">Start date</FieldLabel>
          <DateTimeField
            id="ad-set-editor-start"
            value={startTime}
            onChange={onStartTimeChange}
            disabled={disabled}
            ariaLabel="Start date and time"
          />
        </Box>

        <Box className={styles.field}>
          <FieldLabel htmlFor="ad-set-editor-end">End date (optional)</FieldLabel>
          <DateTimeField
            id="ad-set-editor-end"
            value={endTime}
            onChange={onEndTimeChange}
            disabled={disabled}
            ariaLabel="End date and time"
          />
        </Box>
      </Box>
    </AccordionToggle>
  )
})
