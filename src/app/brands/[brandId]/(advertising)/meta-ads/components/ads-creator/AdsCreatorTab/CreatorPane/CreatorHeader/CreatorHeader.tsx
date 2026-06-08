'use client'

import { memo, useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import RestartAltRoundedIcon from '@mui/icons-material/RestartAltRounded'
import type { LaunchJob } from '../../useLaunchQueue'
import QueueLauncher from '../../QueueLauncher/QueueLauncher'
import DecisionDialog from '../../DecisionDialog/DecisionDialog'
import styles from './CreatorHeader.module.css'

interface Props {
  readonly canReset: boolean
  readonly onResetDraft: () => void
  readonly onPreview: () => void
  readonly jobs: readonly LaunchJob[]
  readonly accountId: string
  readonly onRetry: (jobId: string) => void
  readonly onStop: (jobId: string) => void
  readonly onDismiss: (jobId: string) => void
}

// The draft header: title + the three compact action buttons (Reset / Preview /
// Queue). Owns the reset-confirm dialog as local UI state — Reset only clears once
// the operator confirms, and the actual clearing lives in the parent (onResetDraft).
export default memo(function CreatorHeader({
  canReset,
  onResetDraft,
  onPreview,
  jobs,
  accountId,
  onRetry,
  onStop,
  onDismiss,
}: Props): JSX.Element {
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const openResetConfirm = useCallback(() => setResetConfirmOpen(true), [])
  const closeResetConfirm = useCallback(() => setResetConfirmOpen(false), [])
  const handleResetConfirmed = useCallback(() => {
    onResetDraft()
    setResetConfirmOpen(false)
  }, [onResetDraft])

  return (
    <>
      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <Typography component="span" variant="inherit" className={styles.headerKicker}>Draft</Typography>
          <Typography component="h2" variant="inherit" className={styles.headerTitle}>Launch new ads</Typography>
        </Box>
        <Box className={styles.headerActions}>
          <Tooltip title="Reset draft">
            <Box component="span">
              <IconButton
                className={`${styles.actionBtn} ${styles.resetBtn}`}
                onClick={openResetConfirm}
                disabled={!canReset}
                aria-label="Reset draft"
              >
                <RestartAltRoundedIcon fontSize="small" />
              </IconButton>
            </Box>
          </Tooltip>
          <Tooltip title="Preview">
            <IconButton
              className={styles.actionBtn}
              onClick={onPreview}
              aria-label="Preview"
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <QueueLauncher
            jobs={jobs}
            accountId={accountId}
            onRetry={onRetry}
            onStop={onStop}
            onDismiss={onDismiss}
          />
        </Box>
      </Box>

      <DecisionDialog
        open={resetConfirmOpen}
        title="Reset draft?"
        message="This clears every step — account, campaign, files and copy. Ads already in the launch queue are not affected."
        onClose={closeResetConfirm}
        actions={[
          { label: 'Cancel', onClick: closeResetConfirm },
          { label: 'Reset', onClick: handleResetConfirmed, danger: true },
        ]}
      />
    </>
  )
})
