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
