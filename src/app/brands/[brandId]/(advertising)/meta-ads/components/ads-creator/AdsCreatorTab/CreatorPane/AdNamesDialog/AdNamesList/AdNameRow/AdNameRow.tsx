'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import FormTextField from '../../../../FormTextField/FormTextField'
import { type AdCombo, buildAutoAdName } from '../../../helpers'
import styles from '../../AdNamesDialog.module.css'

interface Props {
  readonly combo: AdCombo
  readonly value: string | undefined
  readonly multiPage: boolean
  readonly onNameChange: (key: string, value: string, fallback: string) => void
}

// One editable ad-name row. Memoized and fed only its own `value`, so typing in a
// sibling row (which rewrites the shared names map) doesn't re-render this field.
export default memo(function AdNameRow({
  combo,
  value,
  multiPage,
  onNameChange,
}: Props): JSX.Element {
  const fallback = buildAutoAdName(combo.creative, combo.pageTok)
  const MediaIcon = combo.creative.media === 'Video' ? MovieOutlinedIcon : ImageOutlinedIcon

  return (
    <Box className={styles.fileRow}>
      <Box className={styles.fileHead}>
        <Box component="span" className={styles.mediaIcon} aria-hidden>
          <MediaIcon fontSize="inherit" />
        </Box>
        <Typography component="span" variant="inherit" className={styles.fileName}>
          {combo.creative.name}
        </Typography>
        {multiPage && (
          <Typography component="span" variant="inherit" className={styles.pageChip}>
            {combo.page.name}
          </Typography>
        )}
      </Box>
      <FormTextField
        value={value ?? fallback}
        onChange={(e) => onNameChange(combo.key, e.target.value, fallback)}
      />
    </Box>
  )
})
