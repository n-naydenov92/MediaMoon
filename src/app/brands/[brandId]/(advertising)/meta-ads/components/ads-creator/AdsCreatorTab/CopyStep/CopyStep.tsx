'use client'

import { memo } from 'react'
import CopyForm, { type CopyValue } from '../CopyForm/CopyForm'

interface Props {
  readonly value: CopyValue
  readonly onChange: (next: CopyValue) => void
}

export default memo(function CopyStep({ value, onChange }: Props): JSX.Element {
  return <CopyForm value={value} onChange={onChange} />
})
