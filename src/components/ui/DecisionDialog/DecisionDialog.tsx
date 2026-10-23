'use client'

import { memo } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import styles from './DecisionDialog.module.css'

export interface DecisionAction {
  readonly label: string
  readonly onClick: () => void
  readonly emphasis?: boolean
  // Destructive confirm (e.g. Reset) — renders the button in error red.
  readonly danger?: boolean
}

type ButtonColor = 'error' | 'primary' | 'inherit'

function actionColor(action: DecisionAction): ButtonColor {
  if (action.danger) {
    return 'error'
  }
  if (action.emphasis) {
    return 'primary'
  }
  return 'inherit'
}

interface Props {
  readonly open: boolean
  readonly title: string
  readonly message: string
  readonly actions: readonly DecisionAction[]
  readonly onClose: () => void
}

// Small choice dialog: a title, one line of context, and 2–3 actions. Backs both
// the per-creative replace confirm and the shared-library conflict prompt so the
// two flows look and behave the same.
export default memo(function DecisionDialog({
  open,
  title,
  message,
  actions,
  onClose,
}: Props): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} classes={{ paper: styles.paper }}>
      <DialogTitle className={styles.title}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText className={styles.message}>{message}</DialogContentText>
      </DialogContent>
      <DialogActions className={styles.actions}>
        {actions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant={action.emphasis || action.danger ? 'contained' : 'text'}
            color={actionColor(action)}
            disableElevation
            onClick={action.onClick}
            className={styles.button}
          >
            {action.label}
          </Button>
        ))}
      </DialogActions>
    </Dialog>
  )
})
