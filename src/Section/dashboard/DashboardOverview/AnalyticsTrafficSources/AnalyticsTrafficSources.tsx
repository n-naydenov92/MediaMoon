'use client'

import { memo, type CSSProperties } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipContentProps,
} from 'recharts'
import {
  PALETTE_DARK,
  PALETTE_LIGHT,
} from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import { formatEur, formatPercentage } from '@/lib/meta/fx'
import { useThemeMode } from '@/styles/useThemeMode'
import type { TrafficSourcePoint } from '@/types/dashboard'
import { pickPaletteColor } from '../../shared/chartColorPalette'
import RechartsTooltipShell from '../../shared/RechartsTooltipShell/RechartsTooltipShell'
import styles from './AnalyticsTrafficSources.module.css'

interface Props {
  readonly sources: readonly TrafficSourcePoint[]
}

const DONUT_INNER = 56
const DONUT_OUTER = 72
const DONUT_PAD = 2
const DONUT_CORNER = 3
const CHART_HEIGHT = 160

export default memo(function AnalyticsTrafficSources({ sources }: Props): JSX.Element {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK

  if (sources.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        Traffic source breakdown not yet available.
      </Alert>
    )
  }

  const totalUsers = sources.reduce((acc, p) => acc + p.activeUsers, 0)
  const totalRevenue = sources.reduce((acc, p) => acc + p.revenue, 0)

  return (
    <>
      <Box className={styles.donutWrap}>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <PieChart>
            <Pie
              data={[...sources]}
              dataKey="activeUsers"
              nameKey="source"
              innerRadius={DONUT_INNER}
              outerRadius={DONUT_OUTER}
              paddingAngle={DONUT_PAD}
              cornerRadius={DONUT_CORNER}
              stroke="none"
            >
              {sources.map((p, idx) => (
                <Cell key={p.source} fill={pickPaletteColor(idx, palette)} />
              ))}
            </Pie>
            <RechartsTooltip
              content={renderTooltip(totalUsers, totalRevenue)}
              position={{ y: 0 }}
              wrapperStyle={{ pointerEvents: 'none' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box className={styles.list}>
        <Box className={styles.header}>
          <Box component="span" aria-hidden="true" />
          <Typography component="span" variant="caption" className={styles.headerCell}>
            Source
          </Typography>
          <Tooltip title="Active users per source" placement="top" arrow disableInteractive>
            <Typography
              component="span"
              variant="caption"
              className={`${styles.headerCell} ${styles.headerUsers}`}
            >
              Users
            </Typography>
          </Tooltip>
          <Tooltip title="Purchase revenue attributed by Google Analytics" placement="top" arrow disableInteractive>
            <Typography
              component="span"
              variant="caption"
              className={`${styles.headerCell} ${styles.headerRevenue}`}
            >
              Revenue
            </Typography>
          </Tooltip>
        </Box>
        {sources.map((p, idx) => {
          const tinted = { '--source-color': pickPaletteColor(idx, palette) } as CSSProperties
          return (
            <Box key={p.source} className={styles.row} style={tinted}>
              <Box component="span" className={styles.dot} aria-hidden="true" />
              <Typography component="span" variant="body2" className={styles.label}>
                {p.source}
              </Typography>
              <Typography component="span" variant="body2" className={styles.users}>
                {p.activeUsers.toLocaleString('en-GB')}
              </Typography>
              <Typography component="span" variant="body2" className={styles.revenue}>
                {p.revenue > 0 ? formatEur(p.revenue) : '—'}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </>
  )
})

function renderTooltip(
  totalUsers: number,
  totalRevenue: number,
): (props: TooltipContentProps) => JSX.Element | null {
  return function ({ active, payload }) {
    if (!active || !payload || payload.length === 0) {
      return null
    }
    const slice = payload[0] as
      | {
        payload?: {
          source?: string
          activeUsers?: number
          revenue?: number
        }
      }
      | undefined
    const point = slice?.payload
    if (!point || typeof point.activeUsers !== 'number' || !point.source) {
      return null
    }
    const userShare = totalUsers > 0 ? point.activeUsers / totalUsers : 0
    const revenue = point.revenue ?? 0
    const revShare = totalRevenue > 0 ? revenue / totalRevenue : 0
    return (
      <RechartsTooltipShell
        label={point.source}
        value={`${point.activeUsers.toLocaleString('en-GB')} users · ${formatPercentage(userShare, 1)}`}
        secondary={revenue > 0 ? `${formatEur(revenue)} · ${formatPercentage(revShare, 1)} of revenue` : undefined}
      />
    )
  }
}
