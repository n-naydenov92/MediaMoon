'use client'

import { memo, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import LinearProgress from '@mui/material/LinearProgress'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined'
import { buildDuplicateName } from './helpers'
import styles from './DuplicateAdSetDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onSuccess?: (newAdSetId: string, newAdSetName: string, status: 'PAUSED' | 'ACTIVE') => void
  readonly accountId: string
  readonly sourceAdSetId: string
  readonly sourceAdSetName: string
  readonly sourceCampaignName: string
}

interface DuplicateResponse {
  readonly result?: { readonly adSetId: string }
  readonly error?: string
}

export default memo(function DuplicateAdSetDialog({
  open,
  onClose,
  onSuccess,
  accountId,
  sourceAdSetId,
  sourceAdSetName,
  sourceCampaignName,
}: Props): JSX.Element {
  const fullScreen = useMediaQuery('(max-width: 600px)')
  const [name, setName] = useState<string>('')
  const [activate, setActivate] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setName(buildDuplicateName(sourceAdSetName))
      setActivate(false)
      setError(null)
      setSubmitting(false)
    }
  }, [open, sourceAdSetName])

  const handleDuplicate = async (): Promise<void> => {
    const trimmed = name.trim()
    if (!trimmed || !sourceAdSetId || !accountId) return
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/meta-ads/adsets/duplicate?accountId=${encodeURIComponent(accountId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adSetId: sourceAdSetId,
            newName: trimmed,
            status: activate ? 'ACTIVE' : 'PAUSED',
          }),
        },
      )
      const json = (await response.json().catch(() => ({}))) as DuplicateResponse
      if (!response.ok || !json.result) {
        throw new Error(json.error ?? `HTTP ${response.status}`)
      }
      onSuccess?.(json.result.adSetId, trimmed, activate ? 'ACTIVE' : 'PAUSED')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="duplicate-adset-title"
      classes={{ paper: styles.paper }}
    >
      {submitting && <LinearProgress className={styles.progress} />}

      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <ContentCopyIcon className={styles.headerIcon} fontSize="inherit" />
          <Typography id="duplicate-adset-title" component="h2" variant="inherit" className={styles.headerTitle}>
            Duplicate ad set
          </Typography>
        </Box>
        <IconButton
          aria-label="Close"
          onClick={onClose}
          disabled={submitting}
          className={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      <Box className={styles.body}>
        <Box className={styles.field}>
          <Typography component="span" variant="inherit" className={styles.fieldLabel}>
            Source campaign
          </Typography>
          <Box className={styles.sourceRow}>
            <CampaignOutlinedIcon className={styles.sourceIcon} fontSize="small" />
            <Typography component="span" variant="inherit" className={styles.sourceText}>
              {sourceCampaignName}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.field}>
          <Typography component="span" variant="inherit" className={styles.fieldLabel}>
            Source ad set
          </Typography>
          <Box className={styles.sourceRow}>
            <AdsClickOutlinedIcon className={styles.sourceIcon} fontSize="small" />
            <Typography component="span" variant="inherit" className={styles.sourceText}>
              {sourceAdSetName}
            </Typography>
          </Box>
        </Box>

        <Box className={styles.divider} aria-hidden />

        <Box className={styles.field}>
          <Typography component="label" variant="inherit" className={styles.fieldLabel} htmlFor="duplicate-adset-name">
            New ad set name
          </Typography>
          <TextField
            id="duplicate-adset-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            variant="outlined"
            fullWidth
            disabled={submitting}
            className="density-dialog"
            placeholder="e.g. Lookalike 1% — 2026-05-22"
          />
        </Box>

        <Box className={styles.statusRow}>
          <Box className={styles.statusLabelWrap}>
            <Typography component="span" variant="inherit" className={styles.statusLabel}>
              Activate immediately
            </Typography>
            <Typography component="span" variant="inherit" className={styles.statusHint}>
              {activate ? 'Will go LIVE and start spending right away.' : 'Will be created paused — safe default.'}
            </Typography>
          </Box>
          <Switch
            checked={activate}
            onChange={(_, next) => setActivate(next)}
            disabled={submitting}
            inputProps={{ 'aria-label': 'Activate immediately after duplication' }}
          />
        </Box>

        <Box className={styles.warning} data-variant={activate ? 'danger' : 'info'} role="alert">
          {activate ? (
            <ReportProblemOutlinedIcon className={styles.warningIcon} fontSize="inherit" />
          ) : (
            <WarningAmberIcon className={styles.warningIcon} fontSize="inherit" />
          )}
          <Box className={styles.warningTextWrap}>
            <Typography component="p" variant="inherit" className={styles.warningTitle}>
              {activate ? 'Will go LIVE immediately' : 'Created in PAUSED state'}
            </Typography>
            <Typography component="p" variant="inherit" className={styles.warningBody}>
              {activate
                ? 'Real budget will start spending the moment this ad set is created. Double-check targeting and budget before confirming.'
                : 'Nothing goes live until you explicitly resume it inside Meta Ads Manager.'}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Box className={styles.errorBox} role="alert">
            <Typography component="p" variant="inherit" className={styles.errorText}>{error}</Typography>
          </Box>
        )}
      </Box>

      <Box component="footer" className={styles.footer}>
        <Button
          type="button"
          variant="text"
          onClick={onClose}
          disabled={submitting}
          className={styles.secondaryButton}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="contained"
          disableElevation
          startIcon={<ContentCopyIcon />}
          onClick={() => {
            void handleDuplicate()
          }}
          disabled={name.trim().length === 0 || submitting}
          className={styles.primaryButton}
        >
          {submitting ? 'Duplicating…' : 'Duplicate'}
        </Button>
      </Box>
    </Dialog>
  )
})
