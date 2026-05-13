'use client'

import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import TrendingDownRoundedIcon from '@mui/icons-material/TrendingDownRounded'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import styles from './WinnerLoserBadge.module.css'

export type BadgeTone = 'winner' | 'loser'

interface Props {
  readonly tone: BadgeTone
  readonly withTooltip?: boolean
}

const COPY: Record<BadgeTone, { readonly label: string; readonly tooltip: string }> = {
  winner: {
    label: 'Winner',
    tooltip: 'ROAS, CPP, CTR & CPLPV all in top tier',
  },
  loser: {
    label: 'Loser',
    tooltip: 'ROAS, CPP, CTR & CPLPV all in worst tier',
  },
}

export default function WinnerLoserBadge({ tone, withTooltip = true }: Props): JSX.Element {
  const Icon = tone === 'winner' ? EmojiEventsRoundedIcon : TrendingDownRoundedIcon
  const { label, tooltip } = COPY[tone]

  const badge = (
    <Box component="span" className={styles.badge} data-tone={tone}>
      <Icon className={styles.icon} fontSize="inherit" />
      <Box component="span" className={styles.label}>
        {label}
      </Box>
    </Box>
  )

  if (!withTooltip) {
    return badge
  }

  return (
    <Tooltip title={tooltip} arrow disableInteractive>
      {badge}
    </Tooltip>
  )
}
