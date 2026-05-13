'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import AltRouteOutlinedIcon from '@mui/icons-material/AltRouteOutlined'
import { arrowFor, computeTrend } from '@/components/kpi/kpiTrend'
import { formatPercentage } from '@/lib/meta/fx'
import BreakdownItem from '../BreakdownItem/BreakdownItem'
import styles from './HeroWithBreakdown.module.css'

interface Props {
  readonly label: string
  readonly totalValue: string
  readonly delta?: number
  readonly deltaLabel: string
  readonly campaignsValue: string
  readonly campaignsPercent: number
  readonly flowsValue: string
  readonly flowsPercent: number
}

export default memo(function HeroWithBreakdown({
  label,
  totalValue,
  delta,
  deltaLabel,
  campaignsValue,
  campaignsPercent,
  flowsValue,
  flowsPercent,
}: Props): JSX.Element {
  const trend = computeTrend(delta)
  return (
    <Box className={styles.tile}>
      <Box component="span" className={styles.label}>
        {label}
      </Box>
      <Box component="span" className={styles.value}>
        {totalValue}
      </Box>
      {delta !== undefined && (
        <Box component="span" className={styles.delta} data-trend={trend}>
          {arrowFor(delta)} {formatPercentage(Math.abs(delta), 0)} {deltaLabel}
        </Box>
      )}
      <Box className={styles.breakdown}>
        <BreakdownItem
          channel="campaigns"
          icon={<CampaignOutlinedIcon fontSize="small" />}
          label="Campaigns"
          value={campaignsValue}
          percent={campaignsPercent}
        />
        <BreakdownItem
          channel="flows"
          icon={<AltRouteOutlinedIcon fontSize="small" />}
          label="Flows"
          value={flowsValue}
          percent={flowsPercent}
        />
      </Box>
    </Box>
  )
})
