'use client'

import { memo } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import LinearProgress from '@mui/material/LinearProgress'
import Skeleton from '@mui/material/Skeleton'
import Typography from '@mui/material/Typography'
import RefreshIcon from '@mui/icons-material/Refresh'
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined'
import CreatorDialog from '../CreatorDialog/CreatorDialog'
import {
  formatMeasuredAt,
  meterColor,
  meterCopy,
  progressValue,
  regainText,
  sortMeters,
  throttledText,
  tierLabel,
} from './helpers'
import { useMetaUsage } from './useMetaUsage'
import styles from './MetaLimitsDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly accountId: string
}

const SKELETON_ROW_KEYS = ['first', 'second', 'third'] as const
const SKELETON_ROW_HEIGHT_PX = 44
const BLOCK_RULE_TEXT = 'Meta blocks requests once a limit reaches 100%.'

export default memo(function MetaLimitsDialog({ open, onClose, accountId }: Props): JSX.Element {
  const { state, refresh } = useMetaUsage(accountId, open)
  const isLoading = state.status === 'loading'

  return (
    <CreatorDialog
      open={open}
      onClose={onClose}
      icon={<SpeedOutlinedIcon fontSize="inherit" />}
      title="Meta API limits"
      titleId="meta-limits-title"
      count={state.status === 'success' ? tierLabel(state.usage.tier) : undefined}
      maxWidth="xs"
      footer={(
        <Box className={styles.footerInner}>
          <Typography component="span" variant="caption" color="text.secondary">
            {state.status === 'success' ? `Measured at ${formatMeasuredAt(state.measuredAt)}` : BLOCK_RULE_TEXT}
          </Typography>
          <Button size="small" startIcon={<RefreshIcon />} onClick={refresh} disabled={isLoading}>
            Refresh
          </Button>
        </Box>
      )}
    >
      <Box className={styles.body}>
        {isLoading && SKELETON_ROW_KEYS.map((key) => (
          <Skeleton key={key} variant="rounded" height={SKELETON_ROW_HEIGHT_PX} />
        ))}
        {state.status === 'throttled' && (
          <Alert severity="warning">{throttledText(state.scope, state.retryAfterSeconds)}</Alert>
        )}
        {state.status === 'error' && <Alert severity="error">{state.message}</Alert>}
        {state.status === 'success' && state.usage.meters.length === 0 && (
          <Typography component="p" variant="body2" color="text.secondary">
            Meta did not report any usage for this ad account.
          </Typography>
        )}
        {state.status === 'success' && sortMeters(state.usage.meters).map((meter) => {
          const copy = meterCopy(meter.key)
          return (
            <Box key={meter.key} className={styles.meter}>
              <Box className={styles.meterHead}>
                <Typography component="span" variant="body2">{copy.label}</Typography>
                <Typography component="span" variant="body2" color="text.secondary">
                  {`${Math.round(meter.pct)}%`}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressValue(meter.pct)}
                color={meterColor(meter.pct)}
                aria-label={copy.label}
              />
              <Typography component="span" variant="caption" color="text.secondary">
                {regainText(meter) ?? copy.hint}
              </Typography>
            </Box>
          )
        })}
      </Box>
    </CreatorDialog>
  )
})
