'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import FormField from '../../FormField/FormField'
import FormTextField from '../../FormTextField/FormTextField'
import { addAt, removeAt, setAt } from './helpers'
import styles from '../CopyForm.module.css'

const DEFAULT_MAX = 5
const VARIATION_ROWS = 2

interface Props {
  readonly label: string
  readonly values: readonly string[]
  readonly onChange: (next: readonly string[]) => void
  readonly placeholder: string
  readonly addNoun: string
  readonly multiline?: boolean
  readonly firstRows?: number
  readonly max?: number
}

export default memo(function VariationList({
  label,
  values,
  onChange,
  placeholder,
  addNoun,
  multiline = false,
  firstRows,
  max = DEFAULT_MAX,
}: Props): JSX.Element {
  const remaining = max - values.length

  return (
    <Box className={styles.fieldGroup}>
      <FormField label={label}>
        <FormTextField
          type={multiline ? undefined : 'text'}
          multiline={multiline}
          rows={multiline ? firstRows : undefined}
          placeholder={placeholder}
          value={values[0]}
          onChange={(e) => onChange(setAt(values, 0, e.target.value))}
        />
      </FormField>

      {values.slice(1).map((text, idx) => {
        const index = idx + 1
        return (
          <Box key={`${addNoun}-var-${index}`} className={styles.variationRow}>
            <FormTextField
              type={multiline ? undefined : 'text'}
              multiline={multiline}
              rows={multiline ? VARIATION_ROWS : undefined}
              placeholder={`Variation ${index}`}
              value={text}
              onChange={(e) => onChange(setAt(values, index, e.target.value))}
            />
            <IconButton
              size="small"
              className={styles.removeVariation}
              onClick={() => onChange(removeAt(values, index))}
              aria-label={`Remove ${addNoun} variation ${index}`}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          </Box>
        )
      })}

      {remaining > 0 && (
        <Box
          component="button"
          type="button"
          className={styles.addVariation}
          onClick={() => onChange(addAt(values, max))}
        >
          <AddCircleOutlineIcon fontSize="small" />
          {`Add ${addNoun} variation (${values.length - 1}/${max - 1})`}
        </Box>
      )}
    </Box>
  )
})
