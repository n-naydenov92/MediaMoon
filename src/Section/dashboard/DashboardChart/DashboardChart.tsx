'use client'

import { useMemo, useState } from 'react'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import MenuItem from '@mui/material/MenuItem'
import Select, { type SelectChangeEvent } from '@mui/material/Select'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PALETTE_DARK, PALETTE_LIGHT } from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import { shortDate } from '@/lib/dateFormat'
import { useThemeMode } from '@/styles/useThemeMode'
import type { DashboardDailyPoint } from '@/types/dashboard'
import {
  availableMetrics,
  enrichDaily,
  METRIC_CONFIG,
  shortMoney,
  THIRD_METRICS,
  type ThirdMetric,
} from './DashboardChart.helpers'
import { renderChartTooltip } from './DashboardChartTooltip'
import DashboardChartLegend from '../DashboardChartLegend'
import styles from './DashboardChart.module.css'

interface Props {
  readonly data: readonly DashboardDailyPoint[]
  readonly hasCommerce: boolean
  readonly hasAnalytics: boolean
}

export default function DashboardChart({
  data,
  hasCommerce,
  hasAnalytics,
}: Props): JSX.Element | null {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK
  const available = useMemo(
    () => availableMetrics(hasCommerce, hasAnalytics),
    [hasCommerce, hasAnalytics],
  )
  const [thirdMetric, setThirdMetric] = useState<ThirdMetric>(available[0] ?? 'roas')

  const effectiveMetric = available.includes(thirdMetric) ? thirdMetric : available[0]
  const config = effectiveMetric ? METRIC_CONFIG[effectiveMetric] : null
  const enriched = useMemo(() => enrichDaily(data, effectiveMetric), [data, effectiveMetric])

  if (data.length === 0) {
    return null
  }

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
        <DashboardChartLegend palette={palette} hasCommerce={hasCommerce} thirdLabel={config?.label} />
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
            <RechartsTooltip content={renderChartTooltip(config, hasCommerce)} />
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
