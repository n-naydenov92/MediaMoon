'use client'

import Tooltip from '@mui/material/Tooltip'
import { adStatusTooltip, classifyAdStatus } from '../adStatusLabels'
import styles from '../LeaderboardCard/LeaderboardCard.module.css'

interface Props {
  readonly status: string
}

export default function StatusDot({ status }: Props): JSX.Element {
  const kind = classifyAdStatus(status)
  const label = adStatusTooltip(status)
  return (
    <Tooltip title={label} arrow disableInteractive>
      <span className={styles.statusDot} data-status={kind} aria-label={label} />
    </Tooltip>
  )
}
