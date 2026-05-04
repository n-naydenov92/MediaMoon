'use client'

import { Fragment, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  DATE_PRESETS,
  DATE_PRESET_LABELS,
  type DatePreset,
} from '@/lib/meta/dateRange'
import { useThemeMode } from '@/styles/useThemeMode'
import styles from './DateRangeDropdown.module.css'

interface Props {
  readonly value: DatePreset
  readonly onChange: (next: DatePreset) => void
  readonly comparisonEnabled: boolean
  readonly onComparisonChange: (next: boolean) => void
}

export default function DateRangeDropdown({
  value,
  onChange,
  comparisonEnabled,
  onComparisonChange,
}: Props): JSX.Element {
  const [open, setOpen] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(() =>
    Math.max(0, DATE_PRESETS.indexOf(value)),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])
  const { mode } = useThemeMode()

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

  function handleMenuKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
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
    <div className={styles.root} ref={rootRef} data-theme={mode}>
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
        <div className={styles.menu} onKeyDown={handleMenuKeyDown}>
          <ul className={styles.list} role="listbox">
            {DATE_PRESETS.map((preset, index) => (
              <Fragment key={preset}>
                <li>
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
                {preset === 'last_7d' && (
                  <li className={styles.divider} role="separator" />
                )}
              </Fragment>
            ))}
          </ul>
          <div className={styles.divider} role="separator" />
          <button
            type="button"
            className={styles.toggleRow}
            onClick={() => onComparisonChange(!comparisonEnabled)}
            aria-pressed={comparisonEnabled}
          >
            <span className={styles.toggleLabel}>Compare to previous period</span>
            <span
              className={styles.toggleSwitch}
              data-on={comparisonEnabled ? 'true' : 'false'}
              aria-hidden
            >
              <span className={styles.toggleKnob} />
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
