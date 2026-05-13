'use client'

import { useRef, useState } from 'react'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import { METRIC_BENCHMARKS, type MetricBenchmark } from '@/lib/meta/metricThresholds'
import WinnerLoserBadge from './WinnerLoserBadge'
import styles from './BenchmarkLegend.module.css'

export default function BenchmarkLegend(): JSX.Element {
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        ref={triggerRef}
        size="small"
        variant="text"
        color="inherit"
        startIcon={<InfoOutlinedIcon fontSize="small" />}
        onClick={() => setOpen(true)}
        className={styles.trigger}
        aria-label="Performance benchmarks"
      >
        <Box component="span" className={styles.triggerLabel}>
          Benchmarks
        </Box>
      </Button>
      <Popover
        anchorEl={triggerRef.current}
        open={open}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{ paper: { className: styles.paper } }}
      >
        <Box className={styles.body}>
          <Box component="span" className={styles.title}>
            Performance benchmarks
          </Box>
          <Box className={styles.grid}>
            <Box component="span" className={styles.colHeader}>Metric</Box>
            <Box component="span" className={styles.colHeader} data-tier="good">Good</Box>
            <Box component="span" className={styles.colHeader} data-tier="warning">Warning</Box>
            <Box component="span" className={styles.colHeader} data-tier="bad">Bad</Box>
            {METRIC_BENCHMARKS.map((row) => (
              <BenchmarkRow key={row.metric} row={row} />
            ))}
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} className={styles.winnerNote}>
            <WinnerLoserBadge tone="winner" withTooltip={false} />
            <Box component="span" className={styles.winnerText}>
              all four metrics in the Good tier.
            </Box>
          </Stack>
          <Stack direction="row" alignItems="center" spacing={1} className={styles.underperformNote}>
            <WinnerLoserBadge tone="loser" withTooltip={false} />
            <Box component="span" className={styles.winnerText}>
              all four metrics in the Bad tier.
            </Box>
          </Stack>
        </Box>
      </Popover>
    </>
  )
}

interface BenchmarkRowProps {
  readonly row: MetricBenchmark
}

function BenchmarkRow({ row }: BenchmarkRowProps): JSX.Element {
  return (
    <>
      <Box component="span" className={styles.metricName}>{row.metric}</Box>
      <Box component="span" className={styles.cell} data-tier="good">{row.goodLabel}</Box>
      <Box component="span" className={styles.cell} data-tier="warning">{row.warningLabel}</Box>
      <Box component="span" className={styles.cell} data-tier="bad">{row.badLabel}</Box>
    </>
  )
}
