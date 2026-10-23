'use client'

import { memo } from 'react'
import TextField, { type TextFieldProps } from '@mui/material/TextField'

// Project default text input: small outlined full-width field carrying the shared
// `density-form` sizing class. Any TextField prop (multiline, type, error, …) still
// passes through, and explicit size/variant/fullWidth override the defaults.
export type FormTextFieldProps = TextFieldProps

export default memo(function FormTextField({ className, ...props }: FormTextFieldProps): JSX.Element {
  return (
    <TextField
      size="small"
      variant="outlined"
      fullWidth
      {...props}
      className={className ? `density-form ${className}` : 'density-form'}
    />
  )
})
