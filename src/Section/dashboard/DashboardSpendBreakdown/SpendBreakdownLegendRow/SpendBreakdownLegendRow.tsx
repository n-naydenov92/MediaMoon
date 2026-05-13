import { type CSSProperties } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { classifyRoas } from '@/lib/meta/roasClassification'
import type { SpendChannel } from '@/types/dashboard'
import ChannelGlyph from '../../shared/ChannelGlyph/ChannelGlyph'
import styles from '../DashboardSpendBreakdown.module.css'

interface Props {
  readonly channel: SpendChannel
  readonly color: string
  readonly label: string
  readonly amount: string
  readonly roas: number | null
}

export default function SpendBreakdownLegendRow({
  channel,
  color,
  label,
  amount,
  roas,
}: Props): JSX.Element {
  const tinted = { '--channel-color': color } as CSSProperties
  const roasTier = roas === null ? 'idle' : classifyRoas(roas)
  const roasTitle =
    roas === null
      ? `${label}: ROAS not available (no revenue tracked for this channel)`
      : `${label}: Return on Ad Spend = revenue ÷ spend. Good ≥ 3.5×, warning 3–3.5×, bad < 3×.`
  return (
    <Box className={styles.legendRow} style={tinted}>
      <Box component="span" className={styles.legendIcon} aria-hidden="true">
        <ChannelGlyph channel={channel} />
      </Box>
      <Box component="span" className={styles.legendDot} aria-hidden="true" />
      <Typography component="span" variant="body2" className={styles.legendLabel}>
        {label}
      </Typography>
      <Tooltip title={roasTitle} placement="top" arrow disableInteractive>
        <Typography
          component="span"
          variant="body2"
          className={styles.legendRoas}
          data-tier={roasTier}
        >
          {roas === null ? '—' : `${roas.toFixed(2)}x`}
        </Typography>
      </Tooltip>
      <Tooltip title={`${label}: Ad spend for this channel`} placement="top" arrow disableInteractive>
        <Typography component="span" variant="body2" className={styles.legendAmount}>
          {amount}
        </Typography>
      </Tooltip>
    </Box>
  )
}
