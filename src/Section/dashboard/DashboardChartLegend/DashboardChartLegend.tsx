import Box from '@mui/material/Box'
import type { ChartPalette } from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import LegendDot from './LegendDot'
import styles from './DashboardChartLegend.module.css'

interface Props {
  readonly palette: ChartPalette
  readonly hasCommerce: boolean
  readonly thirdLabel: string | undefined
}

export default function DashboardChartLegend({
  palette,
  hasCommerce,
  thirdLabel,
}: Props): JSX.Element {
  return (
    <Box className={styles.legend} aria-hidden="true">
      <LegendDot color={palette.spend} label="Spend" />
      {hasCommerce && <LegendDot color={palette.revenue} label="Revenue" />}
      {thirdLabel && <LegendDot color={palette.metric} label={thirdLabel} />}
    </Box>
  )
}
