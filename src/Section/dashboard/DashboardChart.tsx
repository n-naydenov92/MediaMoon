'use client'

import { useState, type CSSProperties } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { PALETTE_DARK, PALETTE_LIGHT } from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import { shortDate } from '@/lib/dateFormat'
import { formatEur, formatPercentage } from '@/lib/meta/fx'
import { useThemeMode } from '@/styles/useThemeMode'
import type { DashboardDailyPoint } from '@/types/dashboard'
import styles from './DashboardChart.module.css'

interface Props {
  readonly data: readonly DashboardDailyPoint[]
  readonly hasCommerce: boolean
  readonly hasAnalytics: boolean
}

const THIRD_METRICS = ['roas', 'orders', 'conversionRate', 'costPerUser', 'aov', 'cpo'] as const
type ThirdMetric = (typeof THIRD_METRICS)[number]

interface MetricSpec {
  readonly label: string
  readonly axis: 'eur' | 'right'
  readonly tickFormat: (v: number) => string
  readonly tooltipFormat: (v: number) => string
  readonly requiresCommerce: boolean
  readonly requiresAnalytics: boolean
  readonly extract: (row: ChartRow) => number | null
}

const METRIC_CONFIG: Record<ThirdMetric, MetricSpec> = {
  roas: {
    label: 'ROAS',
    axis: 'right',
    tickFormat: (v) => `${v.toFixed(1)}x`,
    tooltipFormat: (v) => `${v.toFixed(2)}x`,
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.roas,
  },
  orders: {
    label: 'Orders',
    axis: 'right',
    tickFormat: (v) => v.toLocaleString('en-GB', { maximumFractionDigits: 0 }),
    tooltipFormat: (v) => v.toLocaleString('en-GB', { maximumFractionDigits: 0 }),
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.orders,
  },
  conversionRate: {
    label: 'Conversion Rate',
    axis: 'right',
    tickFormat: (v) => formatPercentage(v, 1),
    tooltipFormat: (v) => formatPercentage(v, 2),
    requiresCommerce: true,
    requiresAnalytics: true,
    extract: (r) => r.conversionRate,
  },
  costPerUser: {
    label: 'Cost per User',
    axis: 'eur',
    tickFormat: shortMoney,
    tooltipFormat: formatEur,
    requiresCommerce: false,
    requiresAnalytics: true,
    extract: (r) => r.costPerUser,
  },
  aov: {
    label: 'Average Order Value',
    axis: 'eur',
    tickFormat: shortMoney,
    tooltipFormat: formatEur,
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.aov,
  },
  cpo: {
    label: 'Cost per Order',
    axis: 'eur',
    tickFormat: shortMoney,
    tooltipFormat: formatEur,
    requiresCommerce: true,
    requiresAnalytics: false,
    extract: (r) => r.cpo,
  },
}

interface ChartRow {
  readonly date: string
  readonly spend: number | null
  readonly revenue: number | null
  readonly orders: number | null
  readonly activeUsers: number | null
  readonly roas: number | null
  readonly aov: number | null
  readonly cpo: number | null
  readonly conversionRate: number | null
  readonly costPerUser: number | null
  readonly thirdValue: number | null
}

export default function DashboardChart({
  data,
  hasCommerce,
  hasAnalytics,
}: Props): JSX.Element | null {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK
  const available = availableMetrics(hasCommerce, hasAnalytics)
  const [thirdMetric, setThirdMetric] = useState<ThirdMetric>(available[0] ?? 'roas')

  if (data.length === 0) {
    return null
  }

  const effectiveMetric = available.includes(thirdMetric) ? thirdMetric : available[0]
  const config = effectiveMetric ? METRIC_CONFIG[effectiveMetric] : null
  const enriched = enrichDaily(data, effectiveMetric)
  const showDots = enriched.length === 1
  const dotProp = showDots ? { r: 4 } : false

  const handleChange = (event: SelectChangeEvent): void => {
    setThirdMetric(event.target.value as ThirdMetric)
  }

  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title="Daily performance"
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
        action={
          available.length > 0 && effectiveMetric ? (
            <Select
              size="small"
              value={effectiveMetric}
              onChange={handleChange}
              className={styles.metricSelect}
            >
              {THIRD_METRICS.map((m) => {
                const cfg = METRIC_CONFIG[m]
                const disabled =
                  (cfg.requiresCommerce && !hasCommerce) ||
                  (cfg.requiresAnalytics && !hasAnalytics)
                return (
                  <MenuItem key={m} value={m} disabled={disabled}>
                    {cfg.label}
                  </MenuItem>
                )
              })}
            </Select>
          ) : null
        }
      />
      <CardContent className={styles.content}>
        <Legend palette={palette} hasCommerce={hasCommerce} thirdLabel={config?.label} />
        <ResponsiveContainer width="100%" height={260} key={effectiveMetric ?? 'none'}>
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
            {config?.axis === 'right' && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: palette.axis, fontSize: 11 }}
                tickFormatter={config.tickFormat}
                width={48}
              />
            )}
            <RechartsTooltip content={renderTooltip(config, hasCommerce)} />
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
            {config && (
              <Line
                yAxisId={config.axis}
                type="monotone"
                dataKey="thirdValue"
                stroke={palette.metric}
                strokeWidth={2}
                dot={dotProp}
                name={config.label}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function availableMetrics(hasCommerce: boolean, hasAnalytics: boolean): readonly ThirdMetric[] {
  return THIRD_METRICS.filter((m) => {
    const cfg = METRIC_CONFIG[m]
    if (cfg.requiresCommerce && !hasCommerce) {
      return false
    }
    if (cfg.requiresAnalytics && !hasAnalytics) {
      return false
    }
    return true
  })
}

function enrichDaily(
  data: readonly DashboardDailyPoint[],
  metric: ThirdMetric | undefined,
): readonly ChartRow[] {
  return data.map((d) => {
    const roas = d.revenue !== null && d.spend !== null && d.spend > 0 ? d.revenue / d.spend : null
    const aov = d.revenue !== null && d.orders !== null && d.orders > 0 ? d.revenue / d.orders : null
    const cpo = d.spend !== null && d.orders !== null && d.orders > 0 ? d.spend / d.orders : null
    const conversionRate =
      d.orders !== null && d.sessions !== null && d.sessions > 0 ? d.orders / d.sessions : null
    const costPerUser =
      d.spend !== null && d.activeUsers !== null && d.activeUsers > 0
        ? d.spend / d.activeUsers
        : null
    const row: Omit<ChartRow, 'thirdValue'> = {
      date: d.date,
      spend: d.spend,
      revenue: d.revenue,
      orders: d.orders,
      activeUsers: d.activeUsers,
      roas,
      aov,
      cpo,
      conversionRate,
      costPerUser,
    }
    return { ...row, thirdValue: metric ? METRIC_CONFIG[metric].extract(row as ChartRow) : null }
  })
}

interface LegendProps {
  readonly palette: typeof PALETTE_DARK
  readonly hasCommerce: boolean
  readonly thirdLabel: string | undefined
}

function Legend({ palette, hasCommerce, thirdLabel }: LegendProps): JSX.Element {
  return (
    <Box className={styles.legend} aria-hidden="true">
      <LegendDot color={palette.spend} label="Spend" />
      {hasCommerce && <LegendDot color={palette.revenue} label="Revenue" />}
      {thirdLabel && <LegendDot color={palette.metric} label={thirdLabel} />}
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

function renderTooltip(
  config: MetricSpec | null,
  hasCommerce: boolean,
): (props: TooltipContentProps) => JSX.Element | null {
  return ({ active, payload }) => {
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
