'use client'

import {
  Area,
  ComposedChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { DailyPoint } from '@/lib/meta/aggregate'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import { useThemeMode } from '@/styles/useThemeMode'
import styles from './SpendChart.module.css'

interface Props {
  readonly data: readonly DailyPoint[]
}

interface ChartPalette {
  readonly spend: string
  readonly revenue: string
  readonly roas: string
  readonly grid: string
  readonly axis: string
}

const PALETTE_DARK: ChartPalette = {
  spend: 'rgba(154, 154, 168, 0.6)',
  revenue: '#6c63ff',
  roas: '#10b981',
  grid: 'rgba(255, 255, 255, 0.06)',
  axis: 'rgba(255, 255, 255, 0.45)',
}

const PALETTE_LIGHT: ChartPalette = {
  spend: 'rgba(74, 74, 88, 0.55)',
  revenue: '#5b52e5',
  roas: '#059669',
  grid: 'rgba(10, 10, 15, 0.06)',
  axis: 'rgba(10, 10, 15, 0.5)',
}

interface ChartRow extends DailyPoint {
  readonly roas: number
}

export default function SpendChart({ data }: Props): JSX.Element {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK

  if (data.length === 0) {
    return <div className={styles.empty}>No spend recorded for the selected range.</div>
  }
  const enriched: readonly ChartRow[] = data.map((d) => ({
    ...d,
    roas: d.spendEur > 0 ? d.revenueEur / d.spendEur : 0,
  }))
  return (
    <div className={styles.chart}>
      <div className={styles.legend} aria-hidden="true">
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-key="spendEur" />
          Spend
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-key="revenueEur" />
          Revenue
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} data-key="roas" />
          ROAS
        </span>
      </div>
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
          <Tooltip content={ChartTooltip} />
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
            stroke={palette.roas}
            strokeWidth={2}
            dot={false}
            name="ROAS"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

function shortDate(value: string): string {
  const [, month, day] = value.split('-')
  return `${day}/${month}`
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

function ChartTooltip(props: TooltipContentProps): JSX.Element | null {
  const { active, payload, label } = props
  if (!active || !payload || payload.length === 0) {
    return null
  }
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{String(label ?? '')}</div>
      {payload.map((entry) => {
        const key =
          typeof entry.dataKey === 'string' || typeof entry.dataKey === 'number'
            ? String(entry.dataKey)
            : String(entry.name ?? '')
        const numericValue = typeof entry.value === 'number' ? entry.value : 0
        return (
          <div key={key} className={styles.tooltipRow}>
            <span className={styles.tooltipDot} data-key={key} />
            <span className={styles.tooltipLabel}>{entry.name}</span>
            <span className={styles.tooltipValue}>{formatTooltipValue(key, numericValue)}</span>
          </div>
        )
      })}
    </div>
  )
}

function formatTooltipValue(key: string, value: number): string {
  if (key === 'roas') {
    return formatRoas(value)
  }
  return formatEur(value)
}
