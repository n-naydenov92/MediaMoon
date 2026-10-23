import { type CSSProperties } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import type { TooltipContentProps } from 'recharts'
import type { ChartPalette } from '@/lib/charts/spendChartPalette'
import { formatEur } from '@/lib/meta/fx'
import type { ChartRow, MetricSpec } from '../helpers'
import styles from '../DashboardChart.module.css'

export function renderChartTooltip(
  config: MetricSpec | null,
  hasCommerce: boolean,
  palette: ChartPalette,
): (props: TooltipContentProps) => JSX.Element | null {
  return function ChartTooltipContent({ active, payload }) {
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
          {row.spend !== null && (
            <TooltipRow color={palette.spend} label="Spend" value={formatEur(row.spend)} />
          )}
          {hasCommerce && row.revenue !== null && (
            <TooltipRow color={palette.revenue} label="Revenue" value={formatEur(row.revenue)} />
          )}
          {config && row.thirdValue !== null && (
            <TooltipRow
              color={palette.metric}
              label={config.label}
              value={config.tooltipFormat(row.thirdValue)}
            />
          )}
        </Box>
      </Card>
    )
  }
}

interface TooltipRowProps {
  readonly color: string
  readonly label: string
  readonly value: string
}

function TooltipRow({ color, label, value }: TooltipRowProps): JSX.Element {
  const dotStyle = { '--dot-color': color } as CSSProperties
  return (
    <Box className={styles.tooltipRow}>
      <Box component="span" className={styles.tooltipLabelGroup}>
        <Box component="span" className={styles.tooltipDot} style={dotStyle} />
        <Typography variant="caption" className={styles.tooltipLabel}>
          {label}
        </Typography>
      </Box>
      <Typography variant="body2" className={styles.tooltipValue}>
        {value}
      </Typography>
    </Box>
  )
}
