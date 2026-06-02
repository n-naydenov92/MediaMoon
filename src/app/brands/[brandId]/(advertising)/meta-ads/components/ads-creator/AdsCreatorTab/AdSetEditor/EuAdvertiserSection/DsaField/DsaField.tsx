'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import SearchSelect, { type SearchSelectCreateAction } from '../../../SearchSelect/SearchSelect'
import FieldLabel from '../../FieldLabel/FieldLabel'
import styles from './DsaField.module.css'

type Mode = 'select' | 'custom'

interface Props {
  readonly label: string
  readonly fieldId: string
  readonly value: string
  readonly options: readonly string[]
  readonly onChange: (next: string) => void
  readonly disabled: boolean
  readonly placeholder: string
}

function resolveInitialMode(value: string, options: readonly string[]): Mode {
  if (value === '') return options.length === 0 ? 'custom' : 'select'
  return options.includes(value) ? 'select' : 'custom'
}

export default memo(function DsaField({
  label,
  fieldId,
  value,
  options,
  onChange,
  disabled,
  placeholder,
}: Props): JSX.Element {
  const [mode, setMode] = useState<Mode>(() => resolveInitialMode(value, options))

  // Re-sync mode when value/options change externally (parent reset, account
  // switch). A user-driven mode toggle below sets mode directly and stays sticky
  // for the lifetime of this open dialog.
  useEffect(() => {
    setMode(resolveInitialMode(value, options))
  }, [value, options])

  const createAction = useMemo<SearchSelectCreateAction>(
    () => ({
      label: 'New name',
      onClick: () => {
        onChange('')
        setMode('custom')
      },
    }),
    [onChange],
  )

  if (mode === 'custom') {
    return (
      <Box className={styles.field}>
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
        <TextField
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          size="small"
          variant="outlined"
          fullWidth
          disabled={disabled}
          className="density-dialog"
          placeholder={placeholder}
        />
        {options.length > 0 && (
          <Button
            type="button"
            size="small"
            variant="text"
            startIcon={<ArrowBackIcon fontSize="inherit" />}
            onClick={() => {
              onChange('')
              setMode('select')
            }}
            disabled={disabled}
            className={styles.switchBack}
          >
            Choose from list
          </Button>
        )}
      </Box>
    )
  }

  return (
    <Box className={styles.field}>
      <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
      <SearchSelect<string>
        value={value === '' ? null : value}
        options={options}
        onChange={(next) => onChange(next ?? '')}
        placeholder={placeholder}
        disabled={disabled}
        getOptionId={(o) => o}
        getOptionLabel={(o) => o}
        noOptionsText="No saved entities. Click 'New name' to enter one."
        createAction={createAction}
      />
    </Box>
  )
})
