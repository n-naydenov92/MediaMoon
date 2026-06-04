'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import FilePicker from '../FilePicker/FilePicker'
import AddedAssets from './AddedAssets/AddedAssets'
import { removeAsset, type AssetCreative } from '../assetCreative'
import type { CopyValue } from '../CopyForm/CopyForm'
import type { CopyOverride } from '../perCreativeCopy'
import styles from './FilesStep.module.css'

interface Props {
  readonly files: readonly File[]
  readonly onChange: (next: readonly File[]) => void
  readonly assets: readonly AssetCreative[]
  readonly onAssetsChange: (next: readonly AssetCreative[]) => void
  readonly copy: CopyValue
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
}

export default memo(function FilesStep({
  files,
  onChange,
  assets,
  onAssetsChange,
  copy,
  copyOverrides,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <FilePicker files={files} onChange={onChange} copy={copy} overrides={copyOverrides} />
      <AddedAssets
        assets={assets}
        onRemove={(assetKey) => onAssetsChange(removeAsset(assets, assetKey))}
        copy={copy}
        overrides={copyOverrides}
      />
    </Box>
  )
})
