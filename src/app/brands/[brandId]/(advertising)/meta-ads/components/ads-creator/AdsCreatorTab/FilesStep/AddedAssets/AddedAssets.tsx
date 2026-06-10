'use client'

import { Fragment, memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { CROSS_BM_BADGE, CROSS_BM_VIDEO_REASON } from '@/config/metaBusinessManagers'
import type { AssetCreative } from '../../assetCreative'
import { type CopyOverride, type OverridableField } from '../../perCreativeCopy'
import type { CreativeDuplicate } from '../../creativeSlots'
import CreativeRow from '../../CreativeRow/CreativeRow'
import styles from './AddedAssets.module.css'

interface Props {
  readonly assets: readonly AssetCreative[]
  readonly onRemove: (assetKey: string) => void
  readonly baseFilled?: ReadonlySet<OverridableField>
  readonly overrides?: ReadonlyMap<string, CopyOverride>
  readonly incompatibleKeys?: ReadonlySet<string>
  readonly duplicates?: readonly CreativeDuplicate[]
  readonly onDuplicate?: (sourceKey: string) => void
  readonly onRemoveDuplicate?: (key: string) => void
}

export default memo(function AddedAssets({
  assets,
  onRemove,
  baseFilled,
  overrides,
  incompatibleKeys,
  duplicates = [],
  onDuplicate,
  onRemoveDuplicate,
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
        {assets.map((asset) => {
          const dups = duplicates.filter((d) => d.sourceKey === asset.assetKey)
          return (
            <Fragment key={asset.assetKey}>
              <Box component="li">
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
                  onDuplicate={onDuplicate}
                  duplicateKey={asset.assetKey}
                  duplicateLabel={`Duplicate ${asset.name}`}
                />
              </Box>
              {onDuplicate && onRemoveDuplicate && dups.map((dup, i) => (
                <Box component="li" key={dup.key}>
                  <CreativeRow
                    thumbnailUrl={asset.thumbnailUrl}
                    thumbnailKind="image"
                    isVideo={asset.mediaType === 'video'}
                    name={`${asset.name} (copy ${i + 1})`}
                    previewUrl={asset.imageUrl ?? asset.thumbnailUrl}
                    previewKind="image"
                    baseFilled={baseFilled}
                    override={overrides?.get(dup.key)}
                    onRemove={onRemoveDuplicate}
                    removeKey={dup.key}
                    removeLabel={`Remove copy ${i + 1} of ${asset.name}`}
                    onDuplicate={onDuplicate}
                    duplicateKey={asset.assetKey}
                    duplicateLabel={`Duplicate ${asset.name}`}
                  />
                </Box>
              ))}
            </Fragment>
          )
        })}
      </Box>
    </Box>
  )
})
