'use client'

import { memo, useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import styles from './DebouncedSearchInput.module.css'

interface Props {
  readonly placeholder?: string
  readonly defaultValue?: string
  readonly debounceMs?: number
  readonly className?: string
  readonly onDebouncedChange: (value: string) => void
}

const DEFAULT_DEBOUNCE_MS = 200

const SEARCH_ADORNMENT = (
  <InputAdornment position="start">
    <SearchIcon fontSize="small" />
  </InputAdornment>
)

// Controlled internally (not by the parent) so the field can render its own clear
// button and stay in sync with what it emits. The debounce only delays the parent
// callback — local typing stays instant and never re-renders the parent per keystroke.
const DebouncedSearchInput = memo(function DebouncedSearchInput({
  placeholder = 'Search…',
  defaultValue = '',
  debounceMs = DEFAULT_DEBOUNCE_MS,
  className,
  onDebouncedChange,
}: Props): JSX.Element {
  const [value, setValue] = useState(defaultValue)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onDebouncedChange)

  const composedClassName = className ? `${styles.root} ${className}` : styles.root

  const emit = useCallback((next: string, immediate: boolean): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (immediate) {
      onChangeRef.current(next)
      return
    }
    timerRef.current = setTimeout(() => {
      onChangeRef.current(next)
    }, debounceMs)
  }, [debounceMs])

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.value
    setValue(next)
    emit(next, false)
  }, [emit])

  const handleClear = useCallback((): void => {
    setValue('')
    emit('', true)
  }, [emit])

  useEffect(() => {
    onChangeRef.current = onDebouncedChange
  }, [onDebouncedChange])

  useEffect(() => () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <TextField
      size="small"
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      className={composedClassName}
      InputProps={{
        startAdornment: SEARCH_ADORNMENT,
        endAdornment: value ? (
          <InputAdornment position="end">
            <IconButton size="small" edge="end" aria-label="Clear search" onClick={handleClear}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  )
})

DebouncedSearchInput.displayName = 'DebouncedSearchInput'

export default DebouncedSearchInput
