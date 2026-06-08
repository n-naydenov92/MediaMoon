'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import PhotoOutlinedIcon from '@mui/icons-material/PhotoOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { CROSS_BM_VIDEO_REASON } from '@/config/metaBusinessManagers'
import type { AssetCreative } from '../../assetCreative'
import { type CopyOverride, type OverridableField } from '../../perCreativeCopy'
import CreativeStatusBadges from '../../CreativeStatusBadges/CreativeStatusBadges'
import styles from './AddedAssets.module.css'

const DIFFERENT_BM_BADGE = 'Different BM'

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
        {assets.map((asset) => {
          const isVideo = asset.mediaType === 'video'
          const invalid = incompatibleKeys?.has(asset.assetKey) ?? false
          return (
            <Box
              component="li"
              key={asset.assetKey}
              className={styles.row}
              data-invalid={invalid ? 'true' : 'false'}
            >
              <Box className={styles.thumbWrap}>
                {asset.thumbnailUrl ? (
                  <Box
                    component="img"
                    src={asset.thumbnailUrl}
                    alt={asset.name}
                    className={styles.thumb}
                    loading="lazy"
                  />
                ) : (
                  <Box component="span" className={styles.placeholder} aria-hidden>
                    {isVideo ? '▶' : '▣'}
                  </Box>
                )}
                {isVideo && (
                  <Box component="span" className={styles.videoBadge} aria-hidden>
                    <PlayArrowRoundedIcon fontSize="inherit" />
                  </Box>
                )}
              </Box>
              <Box className={styles.info}>
                <Box className={styles.nameRow}>
                  {isVideo ? (
                    <MovieOutlinedIcon className={styles.typeIcon} fontSize="small" />
                  ) : (
                    <PhotoOutlinedIcon className={styles.typeIcon} fontSize="small" />
                  )}
                  <Typography component="span" variant="inherit" className={styles.name}>
                    {asset.name}
                  </Typography>
                </Box>
                {invalid ? (
                  <Box className={styles.invalidRow}>
                    <Tooltip title={CROSS_BM_VIDEO_REASON}>
                      <Box component="span" className={styles.errorChip}>{DIFFERENT_BM_BADGE}</Box>
                    </Tooltip>
                    <Button
                      type="button"
                      size="small"
                      color="error"
                      onClick={() => onRemove(asset.assetKey)}
                    >
                      Remove
                    </Button>
                  </Box>
                ) : (
                  <Typography component="span" variant="inherit" className={styles.tag}>
                    Re-uploaded on publish
                  </Typography>
                )}
                {baseFilled && overrides?.has(asset.assetKey) && (
                  <CreativeStatusBadges baseFilled={baseFilled} override={overrides.get(asset.assetKey)} />
                )}
              </Box>
              <IconButton
                size="small"
                className={styles.remove}
                onClick={() => onRemove(asset.assetKey)}
                aria-label={`Remove ${asset.name}`}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
})
