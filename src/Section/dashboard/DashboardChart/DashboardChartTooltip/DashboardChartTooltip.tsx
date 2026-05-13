import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import type { TooltipContentProps } from 'recharts'
import { formatEur } from '@/lib/meta/fx'
import type { ChartRow, MetricSpec } from '../helpers'
import styles from '../DashboardChart.module.css'

export function renderChartTooltip(
  config: MetricSpec | null,
  hasCommerce: boolean,
): (props: TooltipContentProps) => JSX.Element | null {
  return function ({ active, payload }) {
    if (!active || !payload || payload.length === 0) {
      return null
    }
    const first = payload[0] as { payload?: ChartRow } | undefined
    const row = first?.payload
    if (!row) {
      return null
    }
    return (
      <Card variant="outlined" className={styles.tooltip}>
        <Box className={styles.tooltipContent}>
          <Typography variant="caption" className={styles.tooltipDate}>
            {row.date}
          </Typography>
          {row.spend !== null && <TooltipRow label="Spend" value={formatEur(row.spend)} />}
          {hasCommerce && row.revenue !== null && (
            <TooltipRow label="Revenue" value={formatEur(row.revenue)} />
          )}
          {config && row.thirdValue !== null && (
            <TooltipRow label={config.label} value={config.tooltipFormat(row.thirdValue)} />
          )}
        </Box>
      </Card>
    )
  }
}

interface TooltipRowProps {
  readonly label: string
  readonly value: string
}

function TooltipRow({ label, value }: TooltipRowProps): JSX.Element {
  return (
    <Box className={styles.tooltipRow}>
      <Typography variant="caption" className={styles.tooltipLabel}>
        {label}
      </Typography>
      <Typography variant="body2" className={styles.tooltipValue}>
        {value}
      </Typography>
    </Box>
  )
}
