'use client'

import { memo, useMemo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined'
import type { AttributionWindow, Pixel } from '@/lib/gateways/MetaAdsGateway'
import SearchSelect from '../../SearchSelect/SearchSelect'
import SectionTitle from '../SectionTitle/SectionTitle'
import AttributionBidAccordion from './AttributionBidAccordion/AttributionBidAccordion'
import {
  CUSTOM_EVENT_OPTIONS,
  DESTINATION_TYPE_OPTIONS,
  OPTIMIZATION_GOAL_OPTIONS,
  resolveOption,
  type ConversionOption,
} from './options'
import styles from './ConversionSection.module.css'

interface Props {
  readonly destinationType: string
  readonly optimizationGoal: string
  readonly pixelId: string
  readonly customEventType: string
  readonly bidStrategy: string
  readonly bidAmountMajorUnits: number
  readonly currency: string
  readonly pixels: readonly Pixel[]
  readonly pixelsLoading: boolean
  readonly attributionSpec: readonly AttributionWindow[]
  readonly onDestinationTypeChange: (next: string) => void
  readonly onOptimizationGoalChange: (next: string) => void
  readonly onPixelIdChange: (next: string) => void
  readonly onCustomEventTypeChange: (next: string) => void
  readonly onBidStrategyChange: (next: string) => void
  readonly onBidAmountChange: (next: number) => void
  readonly onAttributionSpecChange: (next: readonly AttributionWindow[]) => void
  readonly disabled: boolean
}

export default memo(function ConversionSection({
  destinationType,
  optimizationGoal,
  pixelId,
  customEventType,
  bidStrategy,
  bidAmountMajorUnits,
  currency,
  pixels,
  pixelsLoading,
  attributionSpec,
  onDestinationTypeChange,
  onOptimizationGoalChange,
  onPixelIdChange,
  onCustomEventTypeChange,
  onBidStrategyChange,
  onBidAmountChange,
  onAttributionSpecChange,
  disabled,
}: Props): JSX.Element {
  const destinationOptions = DESTINATION_TYPE_OPTIONS
  const goalOptions = useMemo(
    () => resolveOption(OPTIMIZATION_GOAL_OPTIONS, optimizationGoal),
    [optimizationGoal],
  )
  const eventOptions = useMemo(
    () => resolveOption(CUSTOM_EVENT_OPTIONS, customEventType),
    [customEventType],
  )

  const selectedDestination = useMemo(
    () => destinationOptions.find((o) => o.value === destinationType) ?? null,
    [destinationOptions, destinationType],
  )
  const selectedGoal = useMemo(
    () => goalOptions.find((o) => o.value === optimizationGoal) ?? null,
    [goalOptions, optimizationGoal],
  )
  const selectedEvent = useMemo(
    () => eventOptions.find((o) => o.value === customEventType) ?? null,
    [eventOptions, customEventType],
  )

  const pixelOptionsBase: readonly Pixel[] = pixels
  const pixelOptions = useMemo(() => {
    if (!pixelId || pixelOptionsBase.some((p) => p.id === pixelId)) {
      return pixelOptionsBase
    }
    return [...pixelOptionsBase, { id: pixelId, name: pixelId }]
  }, [pixelOptionsBase, pixelId])
  const selectedPixel = useMemo(
    () => pixelOptions.find((p) => p.id === pixelId) ?? null,
    [pixelOptions, pixelId],
  )

  const showWebsiteFields = destinationType === 'WEBSITE'
    || destinationType === ''
    || destinationType === 'UNDEFINED'

  return (
    <Box className={styles.root}>
      <SectionTitle icon={<TrackChangesOutlinedIcon fontSize="inherit" />}>
        Conversion
      </SectionTitle>

      <Box className={styles.row}>
        <Box className={styles.field}>
          <Typography component="span" variant="inherit" className={styles.label}>
            Conversion location
          </Typography>
          <SearchSelect<ConversionOption>
            value={selectedDestination}
            options={destinationOptions}
            onChange={(next) => onDestinationTypeChange(next?.value ?? '')}
            placeholder="Select location…"
            disabled={disabled}
            getOptionId={(o) => o.value}
            getOptionLabel={(o) => o.label}
            noOptionsText="No matches."
          />
        </Box>

        <Box className={styles.field}>
          <Typography component="span" variant="inherit" className={styles.label}>
            Performance goal
          </Typography>
          <SearchSelect<ConversionOption>
            value={selectedGoal}
            options={goalOptions}
            onChange={(next) => onOptimizationGoalChange(next?.value ?? '')}
            placeholder="Select goal…"
            disabled={disabled}
            getOptionId={(o) => o.value}
            getOptionLabel={(o) => o.label}
            noOptionsText="No matches."
          />
        </Box>
      </Box>

      {showWebsiteFields && (
        <Box className={styles.row}>
          <Box className={styles.field}>
            <Typography component="span" variant="inherit" className={styles.label}>
              Dataset (Pixel)
            </Typography>
            <SearchSelect<Pixel>
              value={selectedPixel}
              options={pixelOptions}
              onChange={(next) => onPixelIdChange(next?.id ?? '')}
              placeholder={pixelsLoading ? 'Loading pixels…' : 'Select pixel…'}
              disabled={disabled || pixelsLoading}
              getOptionId={(o) => o.id}
              getOptionLabel={(o) => o.name}
              getOptionSecondary={(o) => o.id}
              noOptionsText="No pixels found."
            />
          </Box>

          <Box className={styles.field}>
            <Typography component="span" variant="inherit" className={styles.label}>
              Conversion event
            </Typography>
            <SearchSelect<ConversionOption>
              value={selectedEvent}
              options={eventOptions}
              onChange={(next) => onCustomEventTypeChange(next?.value ?? '')}
              placeholder="Select event…"
              disabled={disabled}
              getOptionId={(o) => o.value}
              getOptionLabel={(o) => o.label}
              noOptionsText="No matches."
            />
          </Box>
        </Box>
      )}

      <AttributionBidAccordion
        bidStrategy={bidStrategy}
        bidAmountMajorUnits={bidAmountMajorUnits}
        currency={currency}
        attributionSpec={attributionSpec}
        onBidStrategyChange={onBidStrategyChange}
        onBidAmountChange={onBidAmountChange}
        onAttributionSpecChange={onAttributionSpecChange}
        disabled={disabled}
      />
    </Box>
  )
})
