'use client'

import Box from '@mui/material/Box'
import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DailyPoint } from '@/lib/meta/aggregate'
import { shortDate } from '@/lib/dateFormat'
import { useThemeMode } from '@/styles/useThemeMode'
import SpendChartTooltip from '../SpendChartTooltip/SpendChartTooltip'
import { PALETTE_DARK, PALETTE_LIGHT } from '../../spendChartPalette'
import { enrichWithRoas, shortMoney, shortRoas } from './helpers'
import styles from './SpendChart.module.css'

interface Props {
  readonly data: readonly DailyPoint[]
}

export default function SpendChart({ data }: Props): JSX.Element {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK

  if (data.length === 0) {
    return <Box className={styles.empty}>No spend recorded for the selected range.</Box>
  }
  const enriched = enrichWithRoas(data)
  return (
    <Box className={styles.chart}>
      <Box className={styles.legend} aria-hidden="true">
        <Box component="span" className={styles.legendItem}>
          <Box component="span" className={styles.legendDot} data-key="spendEur" />
          Spend
        </Box>
        <Box component="span" className={styles.legendItem}>
          <Box component="span" className={styles.legendDot} data-key="revenueEur" />
          Revenue
        </Box>
        <Box component="span" className={styles.legendItem}>
          <Box component="span" className={styles.legendDot} data-key="roas" />
          ROAS
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={[...enriched]} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.revenue} stopOpacity={0.35} />
              <stop offset="100%" stopColor={palette.revenue} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={palette.spend} stopOpacity={0.25} />
              <stop offset="100%" stopColor={palette.spend} stopOpacity={0.02} />
            </linearGradient>
          </defs>
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
            yAxisId="money"
            tickLine={false}
            axisLine={false}
            tick={{ fill: palette.axis, fontSize: 11 }}
            tickFormatter={shortMoney}
            width={56}
          />
          <YAxis
            yAxisId="ratio"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fill: palette.axis, fontSize: 11 }}
            tickFormatter={shortRoas}
            width={40}
          />
          <Tooltip content={SpendChartTooltip} />
          <Area
            yAxisId="money"
            type="monotone"
            dataKey="spendEur"
            stroke={palette.spend}
            strokeWidth={1.5}
            fill="url(#spendFill)"
            name="Spend"
          />
          <Area
            yAxisId="money"
            type="monotone"
            dataKey="revenueEur"
            stroke={palette.revenue}
            strokeWidth={2}
            fill="url(#revenueFill)"
            name="Revenue"
          />
          <Line
            yAxisId="ratio"
            type="monotone"
            dataKey="roas"
            stroke={palette.metric}
            strokeWidth={2}
            dot={false}
            name="ROAS"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  )
}
