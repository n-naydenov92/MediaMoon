'use client'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
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
  type ChartPalette,
} from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import { formatEur, formatPercentage } from '@/lib/meta/fx'
import { useThemeMode } from '@/styles/useThemeMode'
import type { SpendBreakdownPoint, SpendChannel } from '@/types/dashboard'
import RechartsTooltipShell from '../shared/RechartsTooltipShell'
import SpendBreakdownLegendRow from './SpendBreakdownLegendRow'
import styles from './DashboardSpendBreakdown.module.css'

interface Props {
  readonly breakdown: readonly SpendBreakdownPoint[]
}

const DONUT_INNER_RADIUS = 78
const DONUT_OUTER_RADIUS = 92
const DONUT_PADDING_ANGLE = 2
const DONUT_CORNER_RADIUS = 4
const CHART_HEIGHT = 220

export default function DashboardSpendBreakdown({ breakdown }: Props): JSX.Element {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK
  const total = breakdown.reduce((acc, p) => acc + p.spend, 0)

  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title="Spend by channel"
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
      />
      <CardContent className={styles.content}>
        {breakdown.length === 0 ? (
          <Typography variant="body2" className={styles.empty}>
            No spend in this range.
          </Typography>
        ) : (
          <>
            <Box className={styles.donutWrap}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={[...breakdown]}
                    dataKey="spend"
                    nameKey="label"
                    innerRadius={DONUT_INNER_RADIUS}
                    outerRadius={DONUT_OUTER_RADIUS}
                    paddingAngle={DONUT_PADDING_ANGLE}
                    cornerRadius={DONUT_CORNER_RADIUS}
                    stroke="none"
                  >
                    {breakdown.map((p) => (
                      <Cell key={p.channel} fill={channelColor(p.channel, palette)} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    content={renderTooltip(total)}
                    position={{ y: 0 }}
                    wrapperStyle={{ pointerEvents: 'none' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box className={styles.centerLabel} aria-hidden="true">
                <Typography component="span" className={styles.centerValue}>
                  {formatEur(total)}
                </Typography>
                <Typography component="span" className={styles.centerCaption}>
                  Total spend
                </Typography>
              </Box>
            </Box>
            <Box className={styles.legend}>
              {breakdown.map((p) => (
                <SpendBreakdownLegendRow
                  key={p.channel}
                  channel={p.channel}
                  color={channelColor(p.channel, palette)}
                  label={p.label}
                  amount={formatEur(p.spend)}
                  roas={p.roas}
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function channelColor(channel: SpendChannel, palette: ChartPalette): string {
  if (channel === 'meta') {
    return palette.channelMeta
  }
  if (channel === 'googleAds') {
    return palette.channelGoogle
  }
  return palette.channelTiktok
}

function renderTooltip(total: number): (props: TooltipContentProps) => JSX.Element | null {
  return function ({ active, payload }) {
    if (!active || !payload || payload.length === 0) {
      return null
    }
    const slice = payload[0] as
      | { payload?: { label?: string; spend?: number } }
      | undefined
    const point = slice?.payload
    if (!point || typeof point.spend !== 'number' || !point.label) {
      return null
    }
    const share = total > 0 ? point.spend / total : 0
    return (
      <RechartsTooltipShell
        label={point.label}
        value={`${formatEur(point.spend)} · ${formatPercentage(share, 1)}`}
      />
    )
  }
}
