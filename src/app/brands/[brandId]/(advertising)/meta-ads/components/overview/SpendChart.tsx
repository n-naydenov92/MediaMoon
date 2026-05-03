'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import type { DailyPoint } from '@/lib/meta/aggregate'
import { formatEur } from '@/lib/meta/fx'
import styles from './SpendChart.module.css'

interface Props {
  readonly data: readonly DailyPoint[]
}

const COLOR_SPEND = 'rgba(154, 154, 168, 0.6)'
const COLOR_REVENUE = '#6c63ff'

export default function SpendChart({ data }: Props): JSX.Element {
  if (data.length === 0) {
    return <div className={styles.empty}>No spend recorded for the selected range.</div>
  }
  return (
    <div className={styles.chart}>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={[...data]} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_REVENUE} stopOpacity={0.35} />
              <stop offset="100%" stopColor={COLOR_REVENUE} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR_SPEND} stopOpacity={0.25} />
              <stop offset="100%" stopColor={COLOR_SPEND} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
            tickFormatter={shortDate}
            minTickGap={24}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }}
            tickFormatter={shortMoney}
            width={56}
          />
          <Tooltip content={ChartTooltip} />
          <Area
            type="monotone"
            dataKey="spendEur"
            stroke={COLOR_SPEND}
            strokeWidth={1.5}
            fill="url(#spendFill)"
            name="Spend"
          />
          <Area
            type="monotone"
            dataKey="revenueEur"
            stroke={COLOR_REVENUE}
            strokeWidth={2}
            fill="url(#revenueFill)"
            name="Revenue"
          />
        </AreaChart>
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

function ChartTooltip(props: TooltipContentProps): JSX.Element | null {
  const { active, payload, label } = props
  if (!active || !payload || payload.length === 0) {
    return null
  }
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipDate}>{String(label ?? '')}</div>
      {payload.map((entry) => {
        const key = typeof entry.dataKey === 'string' || typeof entry.dataKey === 'number'
          ? String(entry.dataKey)
          : entry.name ?? ''
        const numericValue = typeof entry.value === 'number' ? entry.value : 0
        return (
          <div key={key} className={styles.tooltipRow}>
            <span className={styles.tooltipDot} data-key={key} />
            <span className={styles.tooltipLabel}>{entry.name}</span>
            <span className={styles.tooltipValue}>{formatEur(numericValue)}</span>
          </div>
        )
      })}
    </div>
  )
}
