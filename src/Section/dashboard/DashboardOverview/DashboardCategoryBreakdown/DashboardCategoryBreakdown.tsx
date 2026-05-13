'use client'

import { memo, type CSSProperties } from 'react'
import Alert from '@mui/material/Alert'
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
} from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import { formatEur, formatPercentage } from '@/lib/meta/fx'
import { useThemeMode } from '@/styles/useThemeMode'
import type { CategoryBreakdownPoint } from '@/types/dashboard'
import { pickPaletteColor } from '../../shared/chartColorPalette'
import RechartsTooltipShell from '../../shared/RechartsTooltipShell/RechartsTooltipShell'
import SkeletonRows from '../../shared/SkeletonRows/SkeletonRows'
import styles from './DashboardCategoryBreakdown.module.css'

interface Props {
  readonly categories: readonly CategoryBreakdownPoint[]
  readonly hasCommerce: boolean
  readonly loading?: boolean
}

const DONUT_INNER = 70
const DONUT_OUTER = 86
const DONUT_PAD = 2
const DONUT_CORNER = 3
const CHART_HEIGHT = 200

export default memo(function DashboardCategoryBreakdown({
  categories,
  hasCommerce,
  loading = false,
}: Props): JSX.Element {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK
  const total = categories.reduce((acc, c) => acc + c.revenue, 0)

  return (
    <Card variant="outlined" className={styles.card}>
      <CardHeader
        title="Revenue by category"
        titleTypographyProps={{ variant: 'subtitle1', className: styles.title }}
        className={styles.header}
      />
      <CardContent className={styles.content}>
        {loading && <SkeletonRows />}
        {!loading && !hasCommerce && (
          <Alert severity="info" variant="outlined" className={styles.empty}>
            Магазинът не е свързан за този бранд.
          </Alert>
        )}
        {!loading && hasCommerce && categories.length === 0 && (
          <Alert severity="info" variant="outlined" className={styles.empty}>
            Category breakdown not yet available — pending WooCommerce mapping.
          </Alert>
        )}
        {!loading && hasCommerce && categories.length > 0 && (
          <>
            <Box className={styles.donutWrap}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <PieChart>
                  <Pie
                    data={[...categories]}
                    dataKey="revenue"
                    nameKey="category"
                    innerRadius={DONUT_INNER}
                    outerRadius={DONUT_OUTER}
                    paddingAngle={DONUT_PAD}
                    cornerRadius={DONUT_CORNER}
                    stroke="none"
                  >
                    {categories.map((c, idx) => (
                      <Cell key={c.category} fill={pickPaletteColor(idx, palette)} />
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
                  Total revenue
                </Typography>
              </Box>
            </Box>
            <Box className={styles.legend}>
              {categories.map((c, idx) => {
                const tinted = { '--cat-color': pickPaletteColor(idx, palette) } as CSSProperties
                return (
                  <Box key={c.category} className={styles.legendRow} style={tinted}>
                    <Box component="span" className={styles.legendDot} aria-hidden="true" />
                    <Typography component="span" variant="body2" className={styles.legendLabel}>
                      {c.category}
                    </Typography>
                    <Typography component="span" variant="body2" className={styles.legendShare}>
                      {formatPercentage(c.share, 1)}
                    </Typography>
                    <Typography component="span" variant="body2" className={styles.legendAmount}>
                      {formatEur(c.revenue)}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
})

function renderTooltip(total: number): (props: TooltipContentProps) => JSX.Element | null {
  return function ({ active, payload }) {
    if (!active || !payload || payload.length === 0) {
      return null
    }
    const slice = payload[0] as
      | { payload?: { category?: string; revenue?: number } }
      | undefined
    const point = slice?.payload
    if (!point || typeof point.revenue !== 'number' || !point.category) {
      return null
    }
    const share = total > 0 ? point.revenue / total : 0
    return (
      <RechartsTooltipShell
        label={point.category}
        value={`${formatEur(point.revenue)} · ${formatPercentage(share, 1)}`}
      />
    )
  }
}
