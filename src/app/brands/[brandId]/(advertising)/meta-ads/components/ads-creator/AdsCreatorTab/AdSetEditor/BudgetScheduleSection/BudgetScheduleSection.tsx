'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import InfoIcon from '@mui/icons-material/Info'
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined'
import type { BudgetType } from '@/lib/gateways/MetaAdsGateway'
import BudgetField from '../BudgetField/BudgetField'
import FieldLabel from '../FieldLabel/FieldLabel'
import SectionTitle from '../SectionTitle/SectionTitle'
import SegmentedControl from '../SegmentedControl/SegmentedControl'
import ScheduleAccordion from './ScheduleAccordion'
import styles from './BudgetScheduleSection.module.css'

const CBO_HINT = 'Budget is set on the parent campaign (CBO).'

interface Props {
  readonly budgetType: BudgetType
  readonly budgetMajorUnits: number
  readonly startTime: string
  readonly endTime: string
  readonly currency: string
  readonly isCbo: boolean
  readonly onBudgetTypeChange: (next: BudgetType) => void
  readonly onBudgetMajorUnitsChange: (next: number) => void
  readonly onStartTimeChange: (nextIso: string) => void
  readonly onEndTimeChange: (nextIso: string) => void
  readonly disabled: boolean
  readonly budgetError?: string
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
  isCbo,
  onBudgetTypeChange,
  onBudgetMajorUnitsChange,
  onStartTimeChange,
  onEndTimeChange,
  disabled,
  budgetError,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <SectionTitle icon={<PaymentsOutlinedIcon fontSize="inherit" />}>
        Budget & schedule
      </SectionTitle>

      <Box className={styles.row}>
        <Box className={styles.field}>
          <FieldLabel>Type</FieldLabel>
          <SegmentedControl<BudgetType>
            value={budgetType}
            options={BUDGET_OPTIONS}
            onChange={onBudgetTypeChange}
            disabled={disabled || isCbo}
            ariaLabel="Budget type"
            fullWidth
          />
        </Box>

        <Box className={styles.field}>
          {isCbo ? (
            <Box className={styles.labelRow}>
              <FieldLabel htmlFor="ad-set-editor-budget">Campaign budget</FieldLabel>
              <Tooltip title={CBO_HINT} placement="top" enterDelay={200}>
                <InfoIcon
                  className={styles.cboIcon}
                  fontSize="inherit"
                  tabIndex={0}
                  aria-label={CBO_HINT}
                />
              </Tooltip>
            </Box>
          ) : (
            <FieldLabel htmlFor="ad-set-editor-budget">Amount</FieldLabel>
          )}
          <BudgetField
            id="ad-set-editor-budget"
            value={budgetMajorUnits}
            onChange={onBudgetMajorUnitsChange}
            currency={currency}
            disabled={disabled || isCbo}
            error={budgetError}
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
