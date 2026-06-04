'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import FilePicker from '../FilePicker/FilePicker'
import AddedAssets from './AddedAssets/AddedAssets'
import { removeAsset, type AssetCreative } from '../assetCreative'
import styles from './FilesStep.module.css'

interface Props {
  readonly files: readonly File[]
  readonly onChange: (next: readonly File[]) => void
  readonly assets: readonly AssetCreative[]
  readonly onAssetsChange: (next: readonly AssetCreative[]) => void
}

export default memo(function FilesStep({
  files,
  onChange,
  assets,
  onAssetsChange,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <FilePicker files={files} onChange={onChange} />
      <AddedAssets
        assets={assets}
        onRemove={(assetKey) => onAssetsChange(removeAsset(assets, assetKey))}
      />
    </Box>
  )
})
