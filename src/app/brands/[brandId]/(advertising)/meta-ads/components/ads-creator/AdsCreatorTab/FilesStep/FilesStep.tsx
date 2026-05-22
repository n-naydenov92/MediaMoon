'use client'

import { memo } from 'react'
import FilePicker from '../FilePicker/FilePicker'

interface Props {
  readonly files: readonly File[]
  readonly onChange: (next: readonly File[]) => void
}

export default memo(function FilesStep({ files, onChange }: Props): JSX.Element {
  return <FilePicker files={files} onChange={onChange} />
})
