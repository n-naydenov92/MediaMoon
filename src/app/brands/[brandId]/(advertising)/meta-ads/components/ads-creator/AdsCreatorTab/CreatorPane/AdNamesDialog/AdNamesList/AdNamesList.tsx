'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { type AdCombo } from '../../helpers'
import AdNameRow from './AdNameRow/AdNameRow'
import styles from '../AdNamesDialog.module.css'

interface Props {
  readonly combos: readonly AdCombo[]
  readonly adsCount: number
  readonly names: ReadonlyMap<string, string>
  readonly multiPage: boolean
  readonly emptyHint: string
  readonly onNameChange: (key: string, value: string, fallback: string) => void
}

export default memo(function AdNamesList({
  combos,
  adsCount,
  names,
  multiPage,
  emptyHint,
  onNameChange,
}: Props): JSX.Element {
  return (
    <>
      <Box className={styles.listHeader}>
        <Typography component="span" variant="caption" color="text.disabled">
          Ad names
        </Typography>
        <Typography component="span" variant="caption" color="text.secondary" className={styles.listHeaderCount}>
          {adsCount}
        </Typography>
      </Box>

      <Box className={styles.list}>
        {combos.length === 0 && (
          <Typography component="p" variant="body1" color="text.disabled" className={styles.emptyHint}>
            {emptyHint}
          </Typography>
        )}
        {combos.map((combo) => (
          <AdNameRow
            key={combo.key}
            combo={combo}
            value={names.get(combo.key)}
            multiPage={multiPage}
            onNameChange={onNameChange}
          />
        ))}
      </Box>
    </>
  )
})
