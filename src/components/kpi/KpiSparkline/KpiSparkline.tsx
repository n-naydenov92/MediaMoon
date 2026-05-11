'use client'

import { useId } from 'react'
import Box from '@mui/material/Box'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { KpiTrend } from '../kpiTrend'
import KpiSparklineTooltip from './KpiSparklineTooltip'
import styles from './KpiSparkline.module.css'

export interface SparkPoint {
  readonly date: string
  readonly value: number
}

interface Props {
  readonly points: readonly SparkPoint[]
  readonly tone: KpiTrend
  readonly formatValue: (value: number) => string
}

const TONE_TO_VAR: Record<KpiTrend, string> = {
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
  const data = points.map((point, index) => ({ index, ...point }))
  const color = TONE_TO_VAR[tone]
  return (
    <Box className={styles.root} aria-hidden="true">
      <ResponsiveContainer width="100%" height={36}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.32} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            cursor={{ stroke: 'var(--text-muted)', strokeDasharray: '3 3' }}
            content={(props) => <KpiSparklineTooltip {...props} formatValue={formatValue} />}
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
    </Box>
  )
}
