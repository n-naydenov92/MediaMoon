'use client'

import type { CSSProperties } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { PALETTE_DARK, PALETTE_LIGHT } from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import { shortDate } from '@/lib/dateFormat'
import { formatEur } from '@/lib/meta/fx'
import { useThemeMode } from '@/styles/useThemeMode'
import type { DashboardDailyPoint } from '@/types/dashboard'
import styles from './DashboardChart.module.css'

interface Props {
  readonly data: readonly DashboardDailyPoint[]
  readonly hasCommerce: boolean
}

interface ChartRow {
  readonly date: string
  readonly spend: number | null
  readonly revenue: number | null
  readonly roas: number | null
}

export default function DashboardChart({ data, hasCommerce }: Props): JSX.Element | null {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK

  if (data.length === 0) {
    return null
  }

  const enriched = enrichWithRoas(data)
  const showDots = enriched.length === 1
  const dotProp = showDots ? { r: 4 } : false

  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title="Daily performance"
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
      />
      <CardContent className={styles.content}>
        <Legend palette={palette} hasCommerce={hasCommerce} />
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={[...enriched]} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.axis, fontSize: 11 }}
              tickFormatter={shortDate}
              minTickGap={24}
            />
            <YAxis
              yAxisId="eur"
              tickLine={false}
              axisLine={false}
              tick={{ fill: palette.axis, fontSize: 11 }}
              tickFormatter={shortMoney}
              width={56}
            />
            {hasCommerce && (
              <YAxis
                yAxisId="roas"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: palette.axis, fontSize: 11 }}
                tickFormatter={shortRoas}
                width={40}
              />
            )}
            <Tooltip content={DashboardChartTooltip} />
            <Line
              yAxisId="eur"
              type="monotone"
              dataKey="spend"
              stroke={palette.spend}
              strokeWidth={1.5}
              dot={dotProp}
              name="Spend"
              connectNulls
            />
            {hasCommerce && (
              <Line
                yAxisId="eur"
                type="monotone"
                dataKey="revenue"
                stroke={palette.revenue}
                strokeWidth={2}
                dot={dotProp}
                name="Revenue"
                connectNulls
              />
            )}
            {hasCommerce && (
              <Line
                yAxisId="roas"
                type="monotone"
                dataKey="roas"
                stroke={palette.roas}
                strokeWidth={2}
                dot={dotProp}
                name="ROAS"
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function enrichWithRoas(data: readonly DashboardDailyPoint[]): readonly ChartRow[] {
  return data.map((d) => ({
    date: d.date,
    spend: d.spend,
    revenue: d.revenue,
    roas:
      d.revenue !== null && d.spend !== null && d.spend > 0 ? d.revenue / d.spend : null,
  }))
}

interface LegendProps {
  readonly palette: typeof PALETTE_DARK
  readonly hasCommerce: boolean
}

function Legend({ palette, hasCommerce }: LegendProps): JSX.Element {
  return (
    <Box className={styles.legend} aria-hidden="true">
      <LegendDot color={palette.spend} label="Spend" />
      {hasCommerce && <LegendDot color={palette.revenue} label="Revenue" />}
      {hasCommerce && <LegendDot color={palette.roas} label="ROAS" />}
    </Box>
  )
}

function LegendDot({ color, label }: { color: string; label: string }): JSX.Element {
  const dotStyle = { '--dot-color': color } as CSSProperties
  return (
    <Box component="span" className={styles.legendItem}>
      <Box component="span" className={styles.legendDot} style={dotStyle} />
      <Typography component="span" variant="caption">
        {label}
      </Typography>
    </Box>
  )
}

interface ChartPayload {
  readonly date?: string
  readonly spend?: number | null
  readonly revenue?: number | null
  readonly roas?: number | null
}

function DashboardChartTooltip({ active, payload }: TooltipContentProps): JSX.Element | null {
  if (!active || !payload || payload.length === 0) {
    return null
  }
  const first = payload[0] as { payload?: ChartPayload } | undefined
  const row = first?.payload
  if (!row) {
    return null
  }
  return (
    <Card variant="outlined" className={styles.tooltip}>
      <Box className={styles.tooltipContent}>
        <Typography variant="caption" className={styles.tooltipDate}>
          {row.date ?? ''}
        </Typography>
        {row.spend !== null && row.spend !== undefined && (
          <TooltipRow label="Spend" value={formatEur(row.spend)} />
        )}
        {row.revenue !== null && row.revenue !== undefined && (
          <TooltipRow label="Revenue" value={formatEur(row.revenue)} />
        )}
        {row.roas !== null && row.roas !== undefined && (
          <TooltipRow label="ROAS" value={`${row.roas.toFixed(2)}x`} />
        )}
      </Box>
    </Card>
  )
}

function TooltipRow({ label, value }: { label: string; value: string }): JSX.Element {
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

function shortMoney(value: number): string {
  if (value >= 1000) {
    return `€${(value / 1000).toFixed(1)}k`
  }
  return `€${value.toFixed(0)}`
}

function shortRoas(value: number): string {
  return `${value.toFixed(1)}x`
}
