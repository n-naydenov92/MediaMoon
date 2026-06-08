'use client'

import { memo, useCallback, useEffect, useRef, useState } from 'react'
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
  const textRef = useRef<HTMLParagraphElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)

  const handleToggle = useCallback(() => setExpanded((prev) => !prev), [])

  // Only offer "See more" when the copy is actually truncated. Re-measure when it
  // collapses; skip while expanded (the clamp is off, so it would read as not clamped).
  useEffect(() => {
    const el = textRef.current
    if (!el || expanded) {
      return
    }
    setIsClamped(el.scrollHeight > el.clientHeight + 1)
  }, [text, expanded])

  return (
    <Box className={styles.root}>
      <Box component="span" className={styles.rank}>
        {`#${rank}`}
      </Box>
      <Box className={styles.body}>
        <Typography
          component="p"
          variant="inherit"
          ref={textRef}
          className={styles.text}
          data-expanded={expanded ? 'true' : 'false'}
        >
          {text}
        </Typography>
        {isClamped && (
          <Box
            component="button"
            type="button"
            className={styles.toggle}
            onClick={handleToggle}
          >
            {expanded ? 'See less' : 'See more'}
          </Box>
        )}
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
