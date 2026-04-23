'use client'

import { memo } from 'react'
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Button from '@mui/material/Button'
import { LABELS } from '@/components/ui/labels'

interface Props {
  readonly title: string
  readonly message: string
  readonly onRetry?: () => void
}

/**
 * Error display panel with optional retry action.
 */
export default memo(function ErrorPanel({ title, message, onRetry }: Props): JSX.Element {
  return (
    <Alert
      severity="error"
      variant="outlined"
      action={
        onRetry ? (
          <Button color="inherit" size="small" onClick={onRetry}>
            {LABELS.errorPanel.retry}
          </Button>
        ) : null
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  )
})
