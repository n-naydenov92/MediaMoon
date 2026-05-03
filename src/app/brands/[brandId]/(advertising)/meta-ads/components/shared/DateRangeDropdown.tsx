'use client'

import { useEffect, useRef, useState } from 'react'
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
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function handleClick(event: MouseEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    function handleKey(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  return (
    <div className={styles.root} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{DATE_PRESET_LABELS[value]}</span>
        <span className={styles.chevron} aria-hidden>▾</span>
      </button>
      {open && (
        <ul className={styles.menu} role="listbox">
          {DATE_PRESETS.map((preset) => (
            <li key={preset}>
              <button
                type="button"
                className={styles.option}
                data-active={preset === value ? 'true' : 'false'}
                onClick={() => {
                  onChange(preset)
                  setOpen(false)
                }}
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
