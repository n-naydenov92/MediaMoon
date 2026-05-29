'use client'

import { memo } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { currencyToSymbol } from './helpers'

interface Props {
  readonly value: number
  readonly onChange: (next: number) => void
  readonly currency: string
  readonly disabled?: boolean
  readonly id: string
}

export default memo(function BudgetField({
  value,
  onChange,
  currency,
  disabled,
  id,
}: Props): JSX.Element {
  return (
    <TextField
      id={id}
      type="number"
      value={value > 0 ? String(value) : ''}
      onChange={(e) => {
        const raw = e.target.value
        if (raw === '') {
          onChange(0)
          return
        }
        const next = parseFloat(raw)
        if (Number.isFinite(next) && next >= 0) {
          onChange(next)
        }
      }}
      size="small"
      variant="outlined"
      fullWidth
      disabled={disabled}
      className="density-dialog"
      inputProps={{ min: 0, step: 0.01 }}
      // eslint-disable-next-line react/jsx-no-duplicate-props
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Typography component="span" variant="inherit">{currencyToSymbol(currency)}</Typography>
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <Typography component="span" variant="inherit">{currency}</Typography>
          </InputAdornment>
        ),
      }}
    />
  )
})
