'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import PhotoOutlinedIcon from '@mui/icons-material/PhotoOutlined'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import { type CopyOverride, type OverridableField } from '../perCreativeCopy'
import CreativeStatusBadges from '../CreativeStatusBadges/CreativeStatusBadges'
import styles from './CreativeRow.module.css'

interface Props {
  readonly thumbnailUrl: string | null
  // How to render the thumbnail src: a <video> element (uploaded video file) or an
  // <img> (image file, or a library video's poster).
  readonly thumbnailKind: 'image' | 'video'
  // Drives the type icon + the play badge (true for any video, file or library).
  readonly isVideo: boolean
  readonly name: string
  // Hover-preview of the thumbnail; when set the thumb opens it in a tooltip. Pass the
  // highest-resolution source available (full file / imageUrl) so the enlarged preview
  // isn't a pixelated upscale of the small thumbnail. Kind controls <video> vs <img>.
  readonly previewUrl?: string | null
  readonly previewKind?: 'image' | 'video'
  // Cross-BM (or otherwise unusable) state — hangs a notched legend on the border.
  readonly invalid?: boolean
  readonly invalidLabel?: string
  readonly invalidReason?: string
  // Per-creative copy status. Rendered here (rather than passed as an element) so the
  // row's props stay primitive/stable and memo can actually skip re-renders.
  readonly baseFilled?: ReadonlySet<OverridableField>
  readonly override?: CopyOverride
  // Stable parent handler + the row's key, so the click closure lives inside this memo
  // rather than being recreated by the parent on every render.
  readonly onRemove: (key: string) => void
  readonly removeKey: string
  readonly removeLabel: string
  readonly disabled?: boolean
}

export default memo(function CreativeRow({
  thumbnailUrl,
  thumbnailKind,
  isVideo,
  name,
  previewUrl,
  previewKind = 'image',
  invalid = false,
  invalidLabel,
  invalidReason,
  baseFilled,
  override,
  onRemove,
  removeKey,
  removeLabel,
  disabled = false,
}: Props): JSX.Element {
  const thumb = (
    <Box className={styles.thumbWrap} data-preview={previewUrl ? 'true' : 'false'}>
      {thumbnailUrl && thumbnailKind === 'video' && (
        <Box component="video" src={thumbnailUrl} className={styles.thumb} muted playsInline />
      )}
      {thumbnailUrl && thumbnailKind === 'image' && (
        <Box component="img" src={thumbnailUrl} alt={name} className={styles.thumb} loading="lazy" />
      )}
      {!thumbnailUrl && (
        <Box component="span" className={styles.placeholder} aria-hidden>
          {isVideo ? <MovieOutlinedIcon fontSize="inherit" /> : <PhotoOutlinedIcon fontSize="inherit" />}
        </Box>
      )}
      {isVideo && (
        <Box component="span" className={styles.videoBadge} aria-hidden>
          <PlayArrowRoundedIcon fontSize="inherit" />
        </Box>
      )}
    </Box>
  )

  return (
    <Box component="fieldset" className={styles.row} data-invalid={invalid ? 'true' : 'false'}>
      {invalid && invalidLabel && (
        <Tooltip title={invalidReason ?? ''}>
          <Box component="legend" className={styles.legend}>
            <Typography component="span" variant="inherit" color="error">
              {invalidLabel}
            </Typography>
          </Box>
        </Tooltip>
      )}
      <Box className={styles.rowBody}>
        {previewUrl ? (
          <Tooltip
            placement="right"
            enterDelay={250}
            leaveDelay={80}
            classes={{ tooltip: styles.previewTooltip }}
            title={(
              <Box className={styles.previewWrap}>
                {previewKind === 'video' ? (
                  <Box component="video" src={previewUrl} className={styles.preview} autoPlay muted loop playsInline />
                ) : (
                  <Box component="img" src={previewUrl} alt={name} className={styles.preview} />
                )}
              </Box>
            )}
          >
            {thumb}
          </Tooltip>
        ) : thumb}
        <Box className={styles.info}>
          <Box className={styles.nameRow}>
            {isVideo ? (
              <MovieOutlinedIcon className={styles.typeIcon} fontSize="small" />
            ) : (
              <PhotoOutlinedIcon className={styles.typeIcon} fontSize="small" />
            )}
            <Tooltip title={name}>
              <Typography component="span" variant="inherit" className={styles.name}>
                {name}
              </Typography>
            </Tooltip>
          </Box>
          {baseFilled && (
            <CreativeStatusBadges baseFilled={baseFilled} override={override} />
          )}
        </Box>
        <IconButton
          size="small"
          className={styles.remove}
          onClick={() => onRemove(removeKey)}
          aria-label={removeLabel}
          disabled={disabled}
        >
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Box>
    </Box>
  )
})
