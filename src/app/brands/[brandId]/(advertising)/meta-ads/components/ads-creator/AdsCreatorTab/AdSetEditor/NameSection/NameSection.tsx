'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FieldLabel from '../FieldLabel/FieldLabel'
import styles from './NameSection.module.css'

interface Props {
  readonly name: string
  readonly onNameChange: (next: string) => void
  readonly disabled: boolean
  readonly error?: string
  readonly onAutofill?: () => void
}

export default memo(function NameSection({
  name,
  onNameChange,
  disabled,
  error,
  onAutofill,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box className={styles.labelRow}>
        <FieldLabel htmlFor="ad-set-editor-name">Name</FieldLabel>
        {onAutofill && (
          <Button
            type="button"
            size="small"
            variant="text"
            startIcon={<AutoAwesomeIcon fontSize="inherit" />}
            onClick={onAutofill}
            disabled={disabled}
            className={styles.autoButton}
          >
            Auto-name
          </Button>
        )}
      </Box>
      <TextField
        id="ad-set-editor-name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        size="small"
        variant="outlined"
        fullWidth
        disabled={disabled}
        error={Boolean(error)}
        helperText={error}
        className="density-dialog"
        placeholder="e.g. SP-BG-18_65+-All | Adv+-Jun-Sales"
      />
    </Box>
  )
})
