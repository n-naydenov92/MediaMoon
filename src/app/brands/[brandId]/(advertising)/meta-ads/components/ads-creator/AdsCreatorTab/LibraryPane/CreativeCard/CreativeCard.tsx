'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import CheckIcon from '@mui/icons-material/Check'
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded'
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
  onAdd,
}: Props): JSX.Element {
  const trigger = useCreativePreviewTrigger<HTMLDivElement>(adId, accountId)
  const mediaUrl = imageUrl ?? thumbnailUrl

  return (
    <Box className={styles.root} title={disabled && !added ? disabledReason : undefined}>
      <Box
        ref={trigger.ref}
        className={styles.media}
        data-type={creativeType}
        onPointerEnter={trigger.onPointerEnter}
        onPointerLeave={trigger.onPointerLeave}
        onFocus={trigger.onFocus}
        onBlur={trigger.onBlur}
        onClick={trigger.onClick}
      >
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
      </Box>

      <Typography component="h3" variant="inherit" className={styles.label} title={label}>
        {label}
      </Typography>

      <MetricList fields={metricFields} metrics={metrics} variant="stack" />

      <Button
        type="button"
        size="small"
        fullWidth
        variant={added ? 'text' : 'outlined'}
        color={added ? 'success' : 'primary'}
        disabled={disabled && !added}
        startIcon={added ? <CheckIcon fontSize="inherit" /> : <AddIcon fontSize="inherit" />}
        onClick={added || !asset ? undefined : () => onAdd(asset)}
        className={styles.addBtn}
        aria-label={added ? 'Already added' : 'Add to ad'}
      >
        {added ? 'Added' : 'Add'}
      </Button>
    </Box>
  )
})
