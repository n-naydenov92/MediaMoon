'use client'

import { type CSSProperties } from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import FacebookIcon from '@mui/icons-material/Facebook'
import GoogleIcon from '@mui/icons-material/Google'
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
                <LegendRow
                  key={p.channel}
                  channel={p.channel}
                  color={channelColor(p.channel, palette)}
                  label={p.label}
                  amount={formatEur(p.spend)}
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

interface LegendRowProps {
  readonly channel: SpendChannel
  readonly color: string
  readonly label: string
  readonly amount: string
}

function LegendRow({ channel, color, label, amount }: LegendRowProps): JSX.Element {
  const tinted = { '--channel-color': color } as CSSProperties
  return (
    <Box className={styles.legendRow} style={tinted}>
      <Box component="span" className={styles.legendIcon} aria-hidden="true">
        <ChannelGlyph channel={channel} />
      </Box>
      <Box component="span" className={styles.legendDot} aria-hidden="true" />
      <Typography component="span" variant="body2" className={styles.legendLabel}>
        {label}
      </Typography>
      <Typography component="span" variant="body2" className={styles.legendAmount}>
        {amount}
      </Typography>
    </Box>
  )
}

function ChannelGlyph({ channel }: { channel: SpendChannel }): JSX.Element {
  if (channel === 'meta') {
    return <FacebookIcon className={styles.brandIcon} fontSize="small" />
  }
  if (channel === 'googleAds') {
    return <GoogleIcon className={styles.brandIcon} fontSize="small" />
  }
  return <Box component="span" className={styles.brandFallback} />
}

function renderTooltip(total: number): (props: TooltipContentProps) => JSX.Element | null {
  return ({ active, payload }) => {
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
      <Card variant="outlined" className={styles.tooltip}>
        <Box className={styles.tooltipContent}>
          <Typography variant="caption" className={styles.tooltipLabel}>
            {point.label}
          </Typography>
          <Typography variant="body2" className={styles.tooltipValue}>
            {`${formatEur(point.spend)} · ${formatPercentage(share, 1)}`}
          </Typography>
        </Box>
      </Card>
    )
  }
}
