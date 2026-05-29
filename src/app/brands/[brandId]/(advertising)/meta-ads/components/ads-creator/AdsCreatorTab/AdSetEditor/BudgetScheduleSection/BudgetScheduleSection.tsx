'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import type { BudgetType } from '@/lib/gateways/MetaAdsGateway'
import BudgetField from '../BudgetField/BudgetField'
import SectionTitle from '../SectionTitle/SectionTitle'
import SegmentedControl from '../SegmentedControl/SegmentedControl'
import ScheduleAccordion from './ScheduleAccordion'
import styles from './BudgetScheduleSection.module.css'

interface Props {
  readonly budgetType: BudgetType
  readonly budgetMajorUnits: number
  readonly startTime: string
  readonly endTime: string
  readonly currency: string
  readonly onBudgetTypeChange: (next: BudgetType) => void
  readonly onBudgetMajorUnitsChange: (next: number) => void
  readonly onStartTimeChange: (nextIso: string) => void
  readonly onEndTimeChange: (nextIso: string) => void
  readonly disabled: boolean
}

const BUDGET_OPTIONS: readonly { value: BudgetType; label: string }[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'LIFETIME', label: 'Lifetime' },
]

export default memo(function BudgetScheduleSection({
  budgetType,
  budgetMajorUnits,
  startTime,
  endTime,
  currency,
  onBudgetTypeChange,
  onBudgetMajorUnitsChange,
  onStartTimeChange,
  onEndTimeChange,
  disabled,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <SectionTitle icon={<PaymentsOutlinedIcon fontSize="inherit" />}>
        Budget & schedule
      </SectionTitle>

      <Box className={styles.row}>
        <Box className={styles.field}>
          <Typography component="span" variant="inherit" className={styles.label}>
            Type
          </Typography>
          <SegmentedControl<BudgetType>
            value={budgetType}
            options={BUDGET_OPTIONS}
            onChange={onBudgetTypeChange}
            disabled={disabled}
            ariaLabel="Budget type"
            fullWidth
          />
        </Box>

        <Box className={styles.field}>
          <Typography
            component="label"
            variant="inherit"
            className={styles.label}
            htmlFor="ad-set-editor-budget"
          >
            Amount
          </Typography>
          <BudgetField
            id="ad-set-editor-budget"
            value={budgetMajorUnits}
            onChange={onBudgetMajorUnitsChange}
            currency={currency}
            disabled={disabled}
          />
        </Box>
      </Box>

      <ScheduleAccordion
        startTime={startTime}
        endTime={endTime}
        onStartTimeChange={onStartTimeChange}
        onEndTimeChange={onEndTimeChange}
        disabled={disabled}
      />
    </Box>
  )
})
