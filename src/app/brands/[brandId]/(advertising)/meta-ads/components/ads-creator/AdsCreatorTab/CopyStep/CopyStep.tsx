'use client'

import { memo, type ReactNode } from 'react'
import CopyForm, { type CopyValue } from '../CopyForm/CopyForm'
import type { CopyOverride } from '../perCreativeCopy'

interface Props {
  readonly value: CopyValue
  readonly onChange: (next: CopyValue) => void
  readonly adsCount: number
  readonly totalCreatives: number
  readonly overrides: ReadonlyMap<string, CopyOverride>
  readonly nameField: ReactNode
  readonly onNameEach?: () => void
  readonly onEditEach?: () => void
}

export default memo(function CopyStep({
  value,
  onChange,
  adsCount,
  totalCreatives,
  overrides,
  nameField,
  onNameEach,
  onEditEach,
}: Props): JSX.Element {
  return (
    <CopyForm
      value={value}
      onChange={onChange}
      adsCount={adsCount}
      totalCreatives={totalCreatives}
      overrides={overrides}
      nameField={nameField}
      onNameEach={onNameEach}
      onEditEach={onEditEach}
    />
  )
})
