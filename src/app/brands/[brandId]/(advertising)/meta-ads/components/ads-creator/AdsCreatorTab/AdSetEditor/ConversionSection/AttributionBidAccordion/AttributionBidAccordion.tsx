'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import type { AttributionWindow } from '@/lib/gateways/MetaAdsGateway'
import AccordionToggle from '../../AccordionToggle/AccordionToggle'
import BudgetField from '../../BudgetField/BudgetField'
import FieldLabel from '../../FieldLabel/FieldLabel'
import SearchSelect from '../../../SearchSelect/SearchSelect'
import SegmentedControl from '../../SegmentedControl/SegmentedControl'
import {
  BID_STRATEGY_OPTIONS,
  bidStrategyNeedsAmount,
  resolveOption,
  type ConversionOption,
} from '../options'
import { getWindowDays, setWindowDays } from './helpers'
import styles from './AttributionBidAccordion.module.css'

interface Props {
  readonly bidStrategy: string
  readonly bidAmountMajorUnits: number
  readonly currency: string
  readonly attributionSpec: readonly AttributionWindow[]
  readonly onBidStrategyChange: (next: string) => void
  readonly onBidAmountChange: (next: number) => void
  readonly onAttributionSpecChange: (next: readonly AttributionWindow[]) => void
  readonly disabled: boolean
}

type ClickWindow = '1' | '7'
type OptionalWindow = '0' | '1'

const CLICK_OPTIONS: readonly { value: ClickWindow; label: string }[] = [
  { value: '1', label: '1 day' },
  { value: '7', label: '7 days' },
]

const OPTIONAL_OPTIONS: readonly { value: OptionalWindow; label: string }[] = [
  { value: '0', label: 'Off' },
  { value: '1', label: '1 day' },
]

export default memo(function AttributionBidAccordion({
  bidStrategy,
  bidAmountMajorUnits,
  currency,
  attributionSpec,
  onBidStrategyChange,
  onBidAmountChange,
  onAttributionSpecChange,
  disabled,
}: Props): JSX.Element {
  const strategyOptions = useMemo(
    () => resolveOption(BID_STRATEGY_OPTIONS, bidStrategy),
    [bidStrategy],
  )
  const selectedStrategy = useMemo(
    () => strategyOptions.find((o) => o.value === bidStrategy) ?? null,
    [strategyOptions, bidStrategy],
  )

  const showBidAmount = bidStrategyNeedsAmount(bidStrategy)

  const clickDays = getWindowDays(attributionSpec, 'CLICK_THROUGH') === 7 ? '7' : '1'
  const viewDays = getWindowDays(attributionSpec, 'VIEW_THROUGH') === 1 ? '1' : '0'
  const engagedDays = getWindowDays(attributionSpec, 'ENGAGED_VIDEO_VIEW') === 1 ? '1' : '0'

  const handleClickChange = (next: ClickWindow): void => {
    onAttributionSpecChange(setWindowDays(attributionSpec, 'CLICK_THROUGH', parseInt(next, 10)))
  }
  const handleViewChange = (next: OptionalWindow): void => {
    onAttributionSpecChange(setWindowDays(attributionSpec, 'VIEW_THROUGH', parseInt(next, 10)))
  }
  const handleEngagedChange = (next: OptionalWindow): void => {
    onAttributionSpecChange(setWindowDays(attributionSpec, 'ENGAGED_VIDEO_VIEW', parseInt(next, 10)))
  }

  return (
    <AccordionToggle
      closedLabel="Show attribution and bid settings"
      openLabel="Hide attribution and bid settings"
      disabled={disabled}
    >
      <Box className={styles.fields}>
        <Box className={styles.field}>
          <FieldLabel>Bid strategy</FieldLabel>
          <SearchSelect<ConversionOption>
            value={selectedStrategy}
            options={strategyOptions}
            onChange={(next) => onBidStrategyChange(next?.value ?? '')}
            placeholder="Select strategy…"
            disabled={disabled}
            getOptionId={(o) => o.value}
            getOptionLabel={(o) => o.label}
            noOptionsText="No matches."
          />
        </Box>

        {showBidAmount && (
          <Box className={styles.field}>
            <FieldLabel htmlFor="ad-set-editor-bid-amount">
              {bidStrategy === 'COST_CAP' ? 'Cost cap' : 'Bid cap'}
            </FieldLabel>
            <BudgetField
              id="ad-set-editor-bid-amount"
              value={bidAmountMajorUnits}
              onChange={onBidAmountChange}
              currency={currency}
              disabled={disabled}
            />
          </Box>
        )}

        <Box className={styles.field}>
          <FieldLabel>Click-through window</FieldLabel>
          <SegmentedControl<ClickWindow>
            value={clickDays}
            options={CLICK_OPTIONS}
            onChange={handleClickChange}
            disabled={disabled}
            ariaLabel="Click-through attribution window"
          />
        </Box>

        <Box className={styles.field}>
          <FieldLabel>View-through window</FieldLabel>
          <SegmentedControl<OptionalWindow>
            value={viewDays}
            options={OPTIONAL_OPTIONS}
            onChange={handleViewChange}
            disabled={disabled}
            ariaLabel="View-through attribution window"
          />
        </Box>

        <Box className={styles.field}>
          <FieldLabel>Engaged video view window</FieldLabel>
          <SegmentedControl<OptionalWindow>
            value={engagedDays}
            options={OPTIONAL_OPTIONS}
            onChange={handleEngagedChange}
            disabled={disabled}
            ariaLabel="Engaged video view attribution window"
          />
        </Box>
      </Box>
    </AccordionToggle>
  )
})
