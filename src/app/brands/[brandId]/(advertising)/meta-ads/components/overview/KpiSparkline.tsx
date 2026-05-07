'use client'

import { useId } from 'react'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts'
import styles from './KpiSparkline.module.css'

export type SparklineTone = 'up' | 'down' | 'flat'

export interface SparkPoint {
  readonly date: string
  readonly value: number
}

interface Props {
  readonly points: readonly SparkPoint[]
  readonly tone: SparklineTone
  readonly formatValue: (value: number) => string
}

const TONE_TO_VAR: Record<SparklineTone, string> = {
  up: 'var(--success)',
  down: 'var(--error)',
  flat: 'var(--text-muted)',
}

export default function KpiSparkline({ points, tone, formatValue }: Props): JSX.Element | null {
  const gradientId = useId()
  if (points.length < 2) {
    return null
  }
  if (points.every((p) => p.value === 0)) {
    return null
  }
  const color = TONE_TO_VAR[tone]
  return (
    <div className={styles.root}>
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={[...points]} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }}
            content={(props) => <SparkTooltip {...props} formatValue={formatValue} />}
            wrapperStyle={{ outline: 'none' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

interface SparkTooltipProps extends TooltipContentProps {
  readonly formatValue: (value: number) => string
}

function SparkTooltip({ active, payload, formatValue }: SparkTooltipProps): JSX.Element | null {
  const point = payload?.[0]
  if (!active || !point) {
    return null
  }
  const value = typeof point.value === 'number' ? point.value : 0
  const date = typeof point.payload?.date === 'string' ? point.payload.date : ''
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipDate}>{shortDate(date)}</span>
      <span className={styles.tooltipValue}>{formatValue(value)}</span>
    </div>
  )
}

function shortDate(value: string): string {
  if (!value) {
    return ''
  }
  const [, month, day] = value.split('-')
  return `${day}/${month}`
}
