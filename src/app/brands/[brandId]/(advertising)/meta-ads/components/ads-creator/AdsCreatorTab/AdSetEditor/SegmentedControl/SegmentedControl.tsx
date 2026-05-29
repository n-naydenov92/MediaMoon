'use client'

import { memo } from 'react'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import styles from './SegmentedControl.module.css'

interface Option<T extends string> {
  readonly value: T
  readonly label: string
}

interface Props<T extends string> {
  readonly value: T
  readonly options: readonly Option<T>[]
  readonly onChange: (next: T) => void
  readonly disabled?: boolean
  readonly ariaLabel: string
  readonly fullWidth?: boolean
}

function SegmentedControlInner<T extends string>({
  value,
  options,
  onChange,
  disabled,
  ariaLabel,
  fullWidth = false,
}: Props<T>): JSX.Element {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      size="small"
      disabled={disabled}
      onChange={(_, next: T | null) => {
        if (next !== null) {
          onChange(next)
        }
      }}
      aria-label={ariaLabel}
      className={`${styles.group} ${fullWidth ? styles.fullWidth : styles.compact}`}
    >
      {options.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          className={styles.button}
        >
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}

const SegmentedControl = memo(SegmentedControlInner) as <T extends string>(props: Props<T>) => JSX.Element

export default SegmentedControl
