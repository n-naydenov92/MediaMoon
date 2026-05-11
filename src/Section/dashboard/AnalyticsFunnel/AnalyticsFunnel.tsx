'use client'

import { memo, type CSSProperties } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import {
  PALETTE_DARK,
  PALETTE_LIGHT,
  type ChartPalette,
} from '@/app/brands/[brandId]/(advertising)/meta-ads/components/overview/spendChartPalette'
import { formatPercentage } from '@/lib/meta/fx'
import { useThemeMode } from '@/styles/useThemeMode'
import type { FunnelStage } from '@/types/dashboard'
import styles from './AnalyticsFunnel.module.css'

interface Props {
  readonly stages: readonly FunnelStage[]
}

function AnalyticsFunnel({ stages }: Props): JSX.Element {
  const { mode } = useThemeMode()
  const palette = mode === 'light' ? PALETTE_LIGHT : PALETTE_DARK

  if (stages.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        Funnel breakdown not yet available.
      </Alert>
    )
  }
  const top = stages[0]?.activeUsers ?? 0
  if (top === 0) {
    return (
      <Alert severity="info" variant="outlined">
        No active user data for the selected period.
      </Alert>
    )
  }

  return (
    <Box className={styles.list}>
      {stages.map((stage, idx) => {
        const widthRatio = top > 0 ? Math.min(stage.activeUsers / top, 1) : 0
        const fillStyle = {
          '--fill': `${(widthRatio * 100).toFixed(1)}%`,
          '--bar-color': stageColor(stage.key, palette),
        } as CSSProperties
        const isFirst = idx === 0
        const dropTier = isFirst ? 'idle' : tierForConversion(stage.stageConversion)
        const tooltipTitle = isFirst
          ? `${stage.label}: all active users in the period (entry point)`
          : `${stages[idx - 1]?.label ?? 'Previous'} → ${stage.label}: ${formatPercentage(
            stage.stageConversion,
            1,
          )} of previous stage continued`
        return (
          <Tooltip
            key={stage.key}
            title={tooltipTitle}
            placement="top"
            arrow
            disableInteractive
          >
            <Box className={styles.stage} data-stage={stage.key}>
              <Box className={styles.head}>
                <Typography component="span" variant="body2" className={styles.label}>
                  {stage.label}
                </Typography>
                <Typography component="span" variant="body2" className={styles.sessions}>
                  {stage.activeUsers.toLocaleString('en-GB')}
                </Typography>
                <Typography
                  component="span"
                  variant="body2"
                  className={styles.drop}
                  data-tier={dropTier}
                >
                  {isFirst ? '—' : formatPercentage(stage.stageConversion, 1)}
                </Typography>
              </Box>
              <Box className={styles.bar}>
                <Box className={styles.barFill} style={fillStyle} />
              </Box>
            </Box>
          </Tooltip>
        )
      })}
    </Box>
  )
}

export default memo(AnalyticsFunnel)

function tierForConversion(conversion: number): 'good' | 'bad' | 'idle' {
  if (conversion >= 0.5) {
    return 'good'
  }
  if (conversion < 0.1) {
    return 'bad'
  }
  return 'idle'
}

function stageColor(key: FunnelStage['key'], palette: ChartPalette): string {
  switch (key) {
    case 'homePage':
      return palette.channelMeta
    case 'productPage':
      return palette.metric
    case 'addToCart':
      return palette.channelTiktok
    case 'initiateCheckout':
      return '#ef4444'
    case 'purchase':
      return '#22c55e'
    default:
      return palette.channelMeta
  }
}
