'use client'

import { memo, useCallback } from 'react'
import Box from '@mui/material/Box'
import FilePicker from '../FilePicker/FilePicker'
import AddedAssets from './AddedAssets/AddedAssets'
import { removeAsset, type AssetCreative } from '../assetCreative'
import type { CopyOverride, OverridableField } from '../perCreativeCopy'
import styles from './FilesStep.module.css'

interface Props {
  readonly files: readonly File[]
  readonly onChange: (next: readonly File[]) => void
  readonly assets: readonly AssetCreative[]
  readonly onAssetsChange: (next: readonly AssetCreative[]) => void
  readonly baseFilled: ReadonlySet<OverridableField>
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
}

export default memo(function FilesStep({
  files,
  onChange,
  assets,
  onAssetsChange,
  baseFilled,
  copyOverrides,
}: Props): JSX.Element {
  const handleRemove = useCallback(
    (assetKey: string) => onAssetsChange(removeAsset(assets, assetKey)),
    [assets, onAssetsChange],
  )

  return (
    <Box className={styles.root}>
      <FilePicker files={files} onChange={onChange} baseFilled={baseFilled} overrides={copyOverrides} />
      <AddedAssets
        assets={assets}
        onRemove={handleRemove}
        baseFilled={baseFilled}
        overrides={copyOverrides}
      />
    </Box>
  )
})
