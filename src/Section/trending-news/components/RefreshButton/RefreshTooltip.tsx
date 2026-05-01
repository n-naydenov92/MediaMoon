import { memo } from 'react'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { LABELS as APP_LABELS } from '@/components/layout/labels'
import { LABELS } from '@/Section/trending-news/labels'
import styles from './RefreshButton.module.css'

interface Props {
  readonly countdown: string
}

const RefreshTooltip = memo(function RefreshTooltip({ countdown }: Props): JSX.Element {
  return (
    <Stack spacing={1} className={styles.tooltipBody}>
      <Typography variant="caption" className={styles.tooltipAction}>
        {LABELS.refreshButton.action}
      </Typography>
      {countdown && (
        <Typography variant="caption" className={styles.tooltipInfo}>
          {APP_LABELS.topbar.refreshesIn} {countdown}
        </Typography>
      )}
    </Stack>
  )
})

export default RefreshTooltip
