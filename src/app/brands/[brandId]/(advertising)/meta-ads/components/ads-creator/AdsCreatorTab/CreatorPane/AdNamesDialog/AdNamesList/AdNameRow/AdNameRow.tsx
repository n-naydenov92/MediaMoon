'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import type { AdCombo } from '../../../../adNaming'
import type { OverrideActions } from '../../../../useAdNaming'
import AdNameInput from '../../../AdNameInput/AdNameInput'
import styles from '../../AdNamesDialog.module.css'

interface Props {
  readonly combo: AdCombo
  readonly templateName: string
  readonly override: string | undefined
  readonly isDuplicate: boolean
  readonly multiPage: boolean
  readonly actions: OverrideActions
}

// One ad-name row. Memoized and fed only primitives plus its stable combo, so typing
// in one row re-renders just that row. Template edits re-render every row, but off
// the keystroke path — the list reads the template deferred.
export default memo(function AdNameRow({
  combo,
  templateName,
  override,
  isDuplicate,
  multiPage,
  actions,
}: Props): JSX.Element {
  const MediaIcon = combo.creative.media === 'Video' ? MovieOutlinedIcon : ImageOutlinedIcon
  const ariaLabel = multiPage
    ? `Ad name for ${combo.creative.name} on ${combo.page.name}`
    : `Ad name for ${combo.creative.name}`

  return (
    <Box className={styles.fileRow}>
      <Box className={styles.fileHead}>
        <Box component="span" className={styles.mediaIcon} aria-hidden>
          <MediaIcon fontSize="inherit" />
        </Box>
        <Typography component="span" variant="caption" color="text.disabled" className={styles.fileName}>
          {combo.creative.name}
        </Typography>
        {isDuplicate && (
          <Tooltip title="Same name as another ad">
            <Box component="span" className={styles.duplicateIcon}>
              <WarningAmberOutlinedIcon color="warning" fontSize="inherit" />
            </Box>
          </Tooltip>
        )}
        {multiPage && (
          <Tooltip title={combo.page.name}>
            {combo.page.pictureUrl ? (
              <Box
                component="img"
                src={combo.page.pictureUrl}
                alt={combo.page.name}
                referrerPolicy="no-referrer"
                className={styles.adRowAvatar}
              />
            ) : (
              <Box component="span" className={styles.adRowAvatarFallback}>
                <StorefrontOutlinedIcon fontSize="inherit" />
              </Box>
            )}
          </Tooltip>
        )}
      </Box>
      <AdNameInput
        adKey={combo.key}
        templateName={templateName}
        override={override}
        actions={actions}
        ariaLabel={ariaLabel}
      />
    </Box>
  )
})
