'use client'

import { memo } from 'react'
import CopyForm, { type CopyValue } from '../CopyForm/CopyForm'
import type { CopyOverride } from '../perCreativeCopy'

interface Props {
  readonly value: CopyValue
  readonly onChange: (next: CopyValue) => void
  readonly adsCount: number
  readonly overrides: ReadonlyMap<string, CopyOverride>
  readonly onAutoName?: () => void
  readonly onNameEach?: () => void
  readonly onEditEach?: () => void
}

export default memo(function CopyStep({
  value,
  onChange,
  adsCount,
  overrides,
  onAutoName,
  onNameEach,
  onEditEach,
}: Props): JSX.Element {
  return (
    <CopyForm
      value={value}
      onChange={onChange}
      adsCount={adsCount}
      overrides={overrides}
      onAutoName={onAutoName}
      onNameEach={onNameEach}
      onEditEach={onEditEach}
    />
  )
})
