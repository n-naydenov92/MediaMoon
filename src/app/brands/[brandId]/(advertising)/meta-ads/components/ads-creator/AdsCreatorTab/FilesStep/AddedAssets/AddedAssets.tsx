'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { CROSS_BM_BADGE, CROSS_BM_VIDEO_REASON } from '@/config/metaBusinessManagers'
import type { AssetCreative } from '../../assetCreative'
import { type CopyOverride, type OverridableField } from '../../perCreativeCopy'
import CreativeRow from '../../CreativeRow/CreativeRow'
import styles from './AddedAssets.module.css'

interface Props {
  readonly assets: readonly AssetCreative[]
  readonly onRemove: (assetKey: string) => void
  readonly baseFilled?: ReadonlySet<OverridableField>
  readonly overrides?: ReadonlyMap<string, CopyOverride>
  readonly incompatibleKeys?: ReadonlySet<string>
}

export default memo(function AddedAssets({
  assets,
  onRemove,
  baseFilled,
  overrides,
  incompatibleKeys,
}: Props): JSX.Element | null {
  if (assets.length === 0) {
    return null
  }
  return (
    <Box className={styles.root}>
      <Typography component="span" variant="inherit" className={styles.heading}>
        {`Added from library (${assets.length})`}
      </Typography>
      <Box component="ul" className={styles.list}>
        {assets.map((asset) => (
          <Box component="li" key={asset.assetKey}>
            <CreativeRow
              thumbnailUrl={asset.thumbnailUrl}
              thumbnailKind="image"
              isVideo={asset.mediaType === 'video'}
              name={asset.name}
              previewUrl={asset.imageUrl ?? asset.thumbnailUrl}
              previewKind="image"
              invalid={incompatibleKeys?.has(asset.assetKey) ?? false}
              invalidLabel={CROSS_BM_BADGE}
              invalidReason={CROSS_BM_VIDEO_REASON}
              baseFilled={baseFilled}
              override={overrides?.get(asset.assetKey)}
              onRemove={onRemove}
              removeKey={asset.assetKey}
              removeLabel={`Remove ${asset.name}`}
            />
          </Box>
        ))}
      </Box>
    </Box>
  )
})
