'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import { tierForMetric } from '@/lib/meta/metricThresholds'
import type { ElementMetrics } from '../decompose'
import { cardMetricLabel, formatCardMetric, type CardMetricField } from './helpers'
import styles from './MetricList.module.css'

interface Props {
  readonly fields: readonly CardMetricField[]
  readonly metrics: ElementMetrics
  readonly variant?: 'stack' | 'inline'
}

export default memo(function MetricList({ fields, metrics, variant = 'stack' }: Props): JSX.Element {
  return (
    <Box className={styles.root} data-variant={variant}>
      {fields.map((field) => (
        <Box key={field} className={styles.row}>
          <Box component="span" className={styles.label}>{cardMetricLabel(field)}</Box>
          <Box component="span" className={styles.value} data-tier={tierForMetric(field, metrics)}>
            {formatCardMetric(field, metrics)}
          </Box>
        </Box>
      ))}
    </Box>
  )
})
