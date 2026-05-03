'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  type DatePreset,
} from '@/lib/meta/dateRange'
import styles from './DateRangeDropdown.module.css'

interface Props {
  readonly value: DatePreset
  readonly onChange: (next: DatePreset) => void
}

export default function DateRangeDropdown({ value, onChange }: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(() =>
    Math.max(0, DATE_PRESETS.indexOf(value)),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!open) {
      return
    }
    function handleClick(event: MouseEvent): void {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey as unknown as EventListener)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey as unknown as EventListener)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      optionRefs.current[focusedIndex]?.focus()
    }
  }, [open, focusedIndex])

  function handleMenuKeyDown(event: KeyboardEvent<HTMLUListElement>): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setFocusedIndex((i) => (i + 1) % DATE_PRESETS.length)
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setFocusedIndex((i) => (i - 1 + DATE_PRESETS.length) % DATE_PRESETS.length)
      return
    }
    if (event.key === 'Home') {
      event.preventDefault()
      setFocusedIndex(0)
      return
    }
    if (event.key === 'End') {
      event.preventDefault()
      setFocusedIndex(DATE_PRESETS.length - 1)
    }
  }

  function selectPreset(preset: DatePreset): void {
    onChange(preset)
    setOpen(false)
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => {
          setFocusedIndex(Math.max(0, DATE_PRESETS.indexOf(value)))
          setOpen((o) => !o)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{DATE_PRESET_LABELS[value]}</span>
        <span className={styles.chevron} aria-hidden>▾</span>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox" onKeyDown={handleMenuKeyDown}>
          {DATE_PRESETS.map((preset, index) => (
            <li key={preset}>
              <button
                ref={(node) => {
                  optionRefs.current[index] = node
                }}
                type="button"
                role="option"
                aria-selected={preset === value}
                className={styles.option}
                data-active={preset === value ? 'true' : 'false'}
                onClick={() => selectPreset(preset)}
              >
                {DATE_PRESET_LABELS[preset]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
