'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import styles from './AgeRangeSlider.module.css'

interface Props {
  readonly ageMin: number
  readonly ageMax: number
  readonly onChange: (ageMin: number, ageMax: number) => void
  readonly disabled: boolean
}

const MIN = 13
const MAX = 65

function formatLabel(value: number): string {
  return value >= MAX ? '65+' : String(value)
}

export default memo(function AgeRangeSlider({
  ageMin,
  ageMax,
  onChange,
  disabled,
}: Props): JSX.Element {
  const handleChange = (_: Event, next: number | number[]): void => {
    if (!Array.isArray(next) || next.length !== 2) {
      return
    }
    const min = next[0]
    const max = next[1]
    if (typeof min !== 'number' || typeof max !== 'number') {
      return
    }
    onChange(min, max)
  }

  return (
    <Box className={styles.root}>
      <Box className={styles.values}>
        <Typography component="span" variant="inherit">
          {formatLabel(ageMin)}
        </Typography>
        <Typography component="span" variant="inherit" className={styles.dash}>
          —
        </Typography>
        <Typography component="span" variant="inherit">
          {formatLabel(ageMax)}
        </Typography>
      </Box>
      <Slider
        value={[ageMin, ageMax]}
        onChange={handleChange}
        min={MIN}
        max={MAX}
        step={1}
        size="small"
        disabled={disabled}
        valueLabelDisplay="off"
        className={styles.slider}
        aria-label="Age range"
      />
    </Box>
  )
})
