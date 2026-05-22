'use client'

import { memo, useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DuplicateAdSetDialog from '../DuplicateAdSetDialog/DuplicateAdSetDialog'
import styles from './DuplicateAdSetTrigger.module.css'

interface Props {
  readonly disabled: boolean
  readonly accountId: string
  readonly sourceAdSetId: string
  readonly sourceAdSetName: string
  readonly sourceCampaignName: string
}

export default memo(function DuplicateAdSetTrigger({
  disabled,
  accountId,
  sourceAdSetId,
  sourceAdSetName,
  sourceCampaignName,
}: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const handleOpen = useCallback(() => setOpen(true), [])
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <Box component="span" className={styles.wrap}>
      <Button
        type="button"
        size="small"
        variant="text"
        disabled={disabled}
        startIcon={<ContentCopyIcon fontSize="inherit" />}
        className={styles.trigger}
        onClick={handleOpen}
      >
        Duplicate AdSet
      </Button>
      <DuplicateAdSetDialog
        open={open}
        onClose={handleClose}
        accountId={accountId}
        sourceAdSetId={sourceAdSetId}
        sourceAdSetName={sourceAdSetName}
        sourceCampaignName={sourceCampaignName}
      />
    </Box>
  )
})
