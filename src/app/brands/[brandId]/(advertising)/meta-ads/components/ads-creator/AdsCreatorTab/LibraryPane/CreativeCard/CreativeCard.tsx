'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
import VisibilityRoundedIcon from '@mui/icons-material/VisibilityRounded'
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import { useCreativePreviewTrigger } from '../../../../shared/CreativePreview/useCreativePreviewTrigger'
import type { AssetCreative } from '../../assetCreative'
import type { ElementMetrics } from '../decompose'
import MetricList from '../MetricList/MetricList'
import type { CardMetricField } from '../MetricList/helpers'
import styles from './CreativeCard.module.css'

interface Props {
  readonly adId: string
  readonly accountId: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly imageUrl: string | null
  readonly label: string
  readonly metrics: ElementMetrics
  readonly metricFields: readonly CardMetricField[]
  readonly asset: AssetCreative | null
  readonly added: boolean
  readonly disabled: boolean
  readonly disabledReason?: string
  readonly badgeLabel?: string
  readonly onAdd: (asset: AssetCreative) => void
}

export default memo(function CreativeCard({
  adId,
  accountId,
  creativeType,
  thumbnailUrl,
  imageUrl,
  label,
  metrics,
  metricFields,
  asset,
  added,
  disabled,
  disabledReason,
  badgeLabel,
  onAdd,
}: Props): JSX.Element {
  const trigger = useCreativePreviewTrigger<HTMLDivElement>(adId, accountId)
  const mediaUrl = imageUrl ?? thumbnailUrl
  const showBlock = disabled && !added
  const showBadge = showBlock && Boolean(badgeLabel)

  return (
    // fieldset + legend so the cross-BM "Unavailable" label hangs on the border (the
    // MUI NotchedOutline pattern), matching the added-row look. Flex lives in .body, not
    // the fieldset, so the legend notch isn't broken by display:flex.
    <Box component="fieldset" className={styles.root} data-invalid={showBadge ? 'true' : 'false'}>
      {showBadge && (
        <Box component="legend" className={styles.legend}>
          <Typography component="span" variant="caption" color="error">
            {badgeLabel}
          </Typography>
        </Box>
      )}
      <Box className={styles.body}>
        <Box ref={trigger.ref} className={styles.media} data-type={creativeType}>
          {mediaUrl ? (
            <Box component="img" src={mediaUrl} alt={label} className={styles.img} loading="lazy" />
          ) : (
            <Box className={styles.placeholder} aria-hidden>
              {creativeType === 'video' ? (
                <VideocamOutlinedIcon fontSize="inherit" />
              ) : (
                <ImageOutlinedIcon fontSize="inherit" />
              )}
            </Box>
          )}
          {creativeType === 'video' && (
            <Box component="span" className={styles.videoBadge} aria-hidden>
              <PlayArrowRoundedIcon fontSize="inherit" />
            </Box>
          )}
          {/* Always-visible, dedicated preview trigger. Anchored to the media (the ref)
              so the popover positions over the card, but only this button opens it — so
              scanning the grid no longer fires previews under the cursor. No tooltip here
              on purpose, to avoid showing a tooltip and the preview at the same time. */}
          <IconButton
            size="small"
            className={styles.previewBtn}
            onPointerEnter={trigger.onPointerEnter}
            onPointerLeave={trigger.onPointerLeave}
            onFocus={trigger.onFocus}
            onBlur={trigger.onBlur}
            onClick={trigger.onClick}
            aria-label="Preview creative"
          >
            <VisibilityRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Tooltip title={label}>
          <Typography component="h3" variant="inherit" className={styles.label}>
            {label}
          </Typography>
        </Tooltip>

        <MetricList fields={metricFields} metrics={metrics} variant="stack" />

        {/* Reason lives on the disabled action, not the whole card, so hovering the media
            shows only the preview and hovering the button shows only why it's blocked.
            Only shown for the per-card block (cross-BM "Unavailable" carries a badge) —
            the "select an account first" case is already covered by the notice above the
            grid, so the button stays quiet. A disabled button swallows pointer events, so
            the Tooltip needs a span wrapper. */}
        <Tooltip title={showBadge && disabledReason ? disabledReason : ''}>
          <Box component="span" className={styles.addBtnWrap}>
            <Button
              type="button"
              size="small"
              fullWidth
              variant={added ? 'text' : 'outlined'}
              color={added ? 'success' : 'primary'}
              disabled={showBlock}
              startIcon={added ? <CheckIcon fontSize="inherit" /> : <AddIcon fontSize="inherit" />}
              onClick={added || !asset ? undefined : () => onAdd(asset)}
              className={styles.addBtn}
              aria-label={added ? 'Already added' : 'Add to ad'}
            >
              {added ? 'Added' : 'Add'}
            </Button>
          </Box>
        </Tooltip>
      </Box>
    </Box>
  )
})
