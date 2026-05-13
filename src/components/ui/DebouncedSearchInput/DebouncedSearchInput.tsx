'use client'

import { memo, useEffect, useRef, type ChangeEvent } from 'react'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import styles from './DebouncedSearchInput.module.css'

interface Props {
  readonly placeholder?: string
  readonly defaultValue?: string
  readonly debounceMs?: number
  readonly className?: string
  readonly onDebouncedChange: (value: string) => void
}

const DEFAULT_DEBOUNCE_MS = 200

const SEARCH_INPUT_PROPS = {
  startAdornment: (
    <InputAdornment position="start">
      <SearchIcon fontSize="small" />
    </InputAdornment>
  ),
} as const

const DebouncedSearchInput = memo(function DebouncedSearchInput({
  placeholder = 'Search…',
  defaultValue = '',
  debounceMs = DEFAULT_DEBOUNCE_MS,
  className,
  onDebouncedChange,
}: Props): JSX.Element {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onDebouncedChange)

  useEffect(() => {
    onChangeRef.current = onDebouncedChange
  }, [onDebouncedChange])

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  function handleChange(event: ChangeEvent<HTMLInputElement>): void {
    const next = event.target.value
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    timerRef.current = setTimeout(() => {
      onChangeRef.current(next)
    }, debounceMs)
  }

  const composedClassName = className ? `${styles.root} ${className}` : styles.root

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      defaultValue={defaultValue}
      onChange={handleChange}
      className={composedClassName}
      InputProps={SEARCH_INPUT_PROPS}
    />
  )
})

DebouncedSearchInput.displayName = 'DebouncedSearchInput'

export default DebouncedSearchInput
