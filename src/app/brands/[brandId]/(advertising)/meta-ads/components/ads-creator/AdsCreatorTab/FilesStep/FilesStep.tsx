'use client'

import { memo, useCallback } from 'react'
import Box from '@mui/material/Box'
import FilePicker from '../FilePicker/FilePicker'
import AddedAssets from './AddedAssets/AddedAssets'
import { removeAsset, type AssetCreative } from '../assetCreative'
import type { CopyOverride, OverridableField } from '../perCreativeCopy'
import type { CreativeDuplicate } from '../creativeSlots'
import styles from './FilesStep.module.css'

interface Props {
  readonly files: readonly File[]
  readonly onChange: (next: readonly File[]) => void
  readonly assets: readonly AssetCreative[]
  readonly onAssetsChange: (next: readonly AssetCreative[]) => void
  readonly baseFilled: ReadonlySet<OverridableField>
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
  readonly incompatibleAssetKeys: ReadonlySet<string>
  readonly duplicates: readonly CreativeDuplicate[]
  readonly onDuplicate: (sourceKey: string) => void
  readonly onRemoveDuplicate: (key: string) => void
}

export default memo(function FilesStep({
  files,
  onChange,
  assets,
  onAssetsChange,
  baseFilled,
  copyOverrides,
  incompatibleAssetKeys,
  duplicates,
  onDuplicate,
  onRemoveDuplicate,
}: Props): JSX.Element {
  const handleRemove = useCallback(
    (assetKey: string) => onAssetsChange(removeAsset(assets, assetKey)),
    [assets, onAssetsChange],
  )

  return (
    <Box className={styles.root}>
      <FilePicker
        files={files}
        onChange={onChange}
        baseFilled={baseFilled}
        overrides={copyOverrides}
        duplicates={duplicates}
        onDuplicate={onDuplicate}
        onRemoveDuplicate={onRemoveDuplicate}
      />
      <AddedAssets
        assets={assets}
        onRemove={handleRemove}
        baseFilled={baseFilled}
        overrides={copyOverrides}
        incompatibleKeys={incompatibleAssetKeys}
        duplicates={duplicates}
        onDuplicate={onDuplicate}
        onRemoveDuplicate={onRemoveDuplicate}
      />
    </Box>
  )
})
