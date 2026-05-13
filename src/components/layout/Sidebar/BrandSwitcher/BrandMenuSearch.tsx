'use client'

import { memo, type ChangeEvent, type RefObject } from 'react'
import Box from '@mui/material/Box'
import SearchIcon from '@mui/icons-material/Search'
import { LABELS } from '@/components/layout/labels'
import styles from './BrandMenu.module.css'

interface Props {
  readonly value: string
  readonly inputRef: RefObject<HTMLInputElement | null>
  readonly onChange: (next: string) => void
}

export default memo(function BrandMenuSearch({ value, inputRef, onChange }: Props): JSX.Element {
  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onChange(event.target.value)
  }

  return (
    <Box className={styles.searchRow} role="search">
      <SearchIcon className={styles.searchIcon} fontSize="small" aria-hidden="true" />
      <Box
        component="input"
        ref={inputRef}
        type="text"
        className={styles.searchInput}
        placeholder={LABELS.sidebar.findBrand}
        aria-label={LABELS.sidebar.findBrand}
        value={value}
        onChange={handleChange}
      />
      <Box component="kbd" className={styles.escBadge} aria-hidden="true">
        {LABELS.sidebar.escToClose}
      </Box>
    </Box>
  )
})
