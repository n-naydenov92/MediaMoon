'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CloseIcon from '@mui/icons-material/Close'
import {
  CREATIVE_TYPE_VALUES,
  FILTER_FIELDS,
  STATUS_VALUES,
  getFieldKind,
  operatorsFor,
  parseFilterValue,
  type ComparisonOperator,
  type FilterField,
  type FilterRule,
} from './filterRules'
import { fieldLabel, operatorLabel } from './ruleLabels'
import styles from './AdvancedFilters.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly onAdd: (rule: FilterRule) => void
}

const DEFAULT_FIELD: FilterField = 'spend'

const SELECT_PROPS = {
  MenuProps: {
    slotProps: { paper: { className: styles.selectMenuPaper } },
    MenuListProps: { className: styles.selectMenuList },
  },
} as const

export default function AdvancedFilters({ open, onClose, onAdd }: Props): JSX.Element {
  const [field, setField] = useState<FilterField>(DEFAULT_FIELD)
  const [operator, setOperator] = useState<ComparisonOperator>('gt')
  const [valueText, setValueText] = useState<string>('')

  useEffect(() => {
    if (!open) {
      return
    }
    setField(DEFAULT_FIELD)
    setOperator('gt')
    setValueText('')
  }, [open])

  const kind = getFieldKind(field)
  const ops = operatorsFor(field)

  function handleFieldChange(next: FilterField): void {
    setField(next)
    const nextOps = operatorsFor(next)
    if (!nextOps.includes(operator)) {
      setOperator(nextOps[0] ?? 'eq')
    }
    setValueText('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const value = parseFilterValue(field, valueText)
    if (value === null) {
      return
    }
    onAdd({ field, operator, value })
    onClose()
  }

  const canSubmit = parseFilterValue(field, valueText) !== null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ className: styles.paper, component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle className={styles.title}>
        Add filter
        <IconButton aria-label="Close" onClick={onClose} size="small" className={styles.close}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent className={styles.content}>
        <TextField
          select
          label="Field"
          size="small"
          fullWidth
          value={field}
          onChange={(e) => handleFieldChange(e.target.value as FilterField)}
          SelectProps={SELECT_PROPS}
        >
          {FILTER_FIELDS.map((f) => (
            <MenuItem key={f} value={f} dense>
              {fieldLabel(f)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Operator"
          size="small"
          fullWidth
          value={operator}
          onChange={(e) => setOperator(e.target.value as ComparisonOperator)}
          SelectProps={SELECT_PROPS}
        >
          {ops.map((op) => (
            <MenuItem key={op} value={op} dense>
              {operatorLabel(op)}
            </MenuItem>
          ))}
        </TextField>
        {kind === 'number' && (
          <TextField
            label="Value"
            size="small"
            fullWidth
            type="number"
            inputProps={{ step: 'any' }}
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
            autoFocus
          />
        )}
        {kind === 'status' && (
          <TextField
            select
            label="Value"
            size="small"
            fullWidth
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
            SelectProps={SELECT_PROPS}
          >
            <MenuItem value="" disabled dense>
              Select…
            </MenuItem>
            {STATUS_VALUES.map((v) => (
              <MenuItem key={v} value={v} dense>
                {v}
              </MenuItem>
            ))}
          </TextField>
        )}
        {kind === 'creativeType' && (
          <TextField
            select
            label="Value"
            size="small"
            fullWidth
            value={valueText}
            onChange={(e) => setValueText(e.target.value)}
            SelectProps={SELECT_PROPS}
          >
            <MenuItem value="" disabled dense>
              Select…
            </MenuItem>
            {CREATIVE_TYPE_VALUES.map((v) => (
              <MenuItem key={v} value={v} dense>
                {v}
              </MenuItem>
            ))}
          </TextField>
        )}
      </DialogContent>
      <DialogActions className={styles.actions}>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={!canSubmit}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

