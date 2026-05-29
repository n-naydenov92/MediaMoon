'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import FieldLabel from '../FieldLabel/FieldLabel'
import styles from './NameSection.module.css'

interface Props {
  readonly name: string
  readonly onNameChange: (next: string) => void
  readonly disabled: boolean
}

export default memo(function NameSection({
  name,
  onNameChange,
  disabled,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <FieldLabel htmlFor="ad-set-editor-name">Name</FieldLabel>
      <TextField
        id="ad-set-editor-name"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        size="small"
        variant="outlined"
        fullWidth
        disabled={disabled}
        className="density-dialog"
        placeholder="e.g. Lookalike 1% — 2026-05-22"
      />
    </Box>
  )
})
