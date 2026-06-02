'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import FormTextField from '../../../FormTextField/FormTextField'
import { type AdCombo, buildAutoAdName, mediaToken } from '../../helpers'
import styles from '../AdNamesDialog.module.css'

interface Props {
  readonly combos: readonly AdCombo[]
  readonly adsCount: number
  readonly names: ReadonlyMap<string, string>
  readonly multiPage: boolean
  readonly onNameChange: (key: string, value: string, fallback: string) => void
}

export default memo(function AdNamesList({
  combos,
  adsCount,
  names,
  multiPage,
  onNameChange,
}: Props): JSX.Element {
  return (
    <>
      <Box className={styles.listHeader}>
        <Typography component="span" variant="inherit" className={styles.listHeaderLabel}>
          Ad names
        </Typography>
        <Typography component="span" variant="inherit" className={styles.listHeaderCount}>
          {adsCount}
        </Typography>
      </Box>

      <Box className={styles.list}>
        {combos.map((combo, index) => {
          const fallback = buildAutoAdName(combo.file, combo.pageTok)
          const MediaIcon = mediaToken(combo.file) === 'Video' ? MovieOutlinedIcon : ImageOutlinedIcon
          return (
            <Box key={`${combo.page.id}-${index}`} className={styles.fileRow}>
              <Box className={styles.fileHead}>
                <Box component="span" className={styles.mediaIcon} aria-hidden>
                  <MediaIcon fontSize="inherit" />
                </Box>
                <Typography component="span" variant="inherit" className={styles.fileName}>
                  {combo.file.name}
                </Typography>
                {multiPage && (
                  <Typography component="span" variant="inherit" className={styles.pageChip}>
                    {combo.page.name}
                  </Typography>
                )}
              </Box>
              <FormTextField
                value={names.get(combo.key) ?? fallback}
                onChange={(e) => onNameChange(combo.key, e.target.value, fallback)}
              />
            </Box>
          )
        })}
      </Box>
    </>
  )
})
