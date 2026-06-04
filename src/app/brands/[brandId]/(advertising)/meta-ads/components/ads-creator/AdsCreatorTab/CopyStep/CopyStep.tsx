'use client'

import { memo } from 'react'
import CopyForm, { type CopyValue } from '../CopyForm/CopyForm'

interface Props {
  readonly value: CopyValue
  readonly onChange: (next: CopyValue) => void
  readonly adsCount: number
  readonly onAutoName?: () => void
  readonly onNameEach?: () => void
  readonly onEditEach?: () => void
}

export default memo(function CopyStep({
  value,
  onChange,
  adsCount,
  onAutoName,
  onNameEach,
  onEditEach,
}: Props): JSX.Element {
  return (
    <CopyForm
      value={value}
      onChange={onChange}
      adsCount={adsCount}
      onAutoName={onAutoName}
      onNameEach={onNameEach}
      onEditEach={onEditEach}
    />
  )
})
