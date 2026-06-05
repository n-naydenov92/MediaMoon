'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import type { ElementMetrics } from '../decompose'
import MetricList from '../MetricList/MetricList'
import type { CardMetricField } from '../MetricList/helpers'
import styles from './TextElementRow.module.css'

interface Props {
  readonly rank: number
  readonly text: string
  readonly usedInAds: number
  readonly metrics: ElementMetrics
  readonly metricFields: readonly CardMetricField[]
  readonly added: boolean
  readonly disabled: boolean
  readonly onAdd: (text: string) => void
}

export default memo(function TextElementRow({
  rank,
  text,
  usedInAds,
  metrics,
  metricFields,
  added,
  disabled,
  onAdd,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box component="span" className={styles.rank}>
        {`#${rank}`}
      </Box>
      <Box className={styles.body}>
        <Typography component="p" variant="inherit" className={styles.text}>
          {text}
        </Typography>
        <Box className={styles.metricsRow}>
          <MetricList fields={metricFields} metrics={metrics} variant="inline" />
          <Box component="span" className={styles.usage}>
            {usedInAds === 1 ? '1 ad' : `${usedInAds} ads`}
          </Box>
        </Box>
      </Box>
      <Button
        type="button"
        size="small"
        variant={added ? 'text' : 'outlined'}
        color={added ? 'success' : 'primary'}
        disabled={disabled && !added}
        startIcon={added ? <CheckIcon fontSize="inherit" /> : <AddIcon fontSize="inherit" />}
        onClick={added ? undefined : () => onAdd(text)}
        className={styles.addBtn}
        aria-label={added ? 'Already added' : 'Add to ad'}
      >
        {added ? 'Added' : 'Add'}
      </Button>
    </Box>
  )
})
