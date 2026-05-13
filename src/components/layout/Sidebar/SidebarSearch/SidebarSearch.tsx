'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import SearchIcon from '@mui/icons-material/Search'
import styles from './SidebarSearch.module.css'

const PLACEHOLDER = 'Search modules…'

interface Props {
  readonly value: string
  readonly onChange: (next: string) => void
}

function SidebarSearch({ value, onChange }: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <SearchIcon className={styles.icon} fontSize="small" aria-hidden="true" />
      <Box
        component="input"
        type="text"
        className={styles.input}
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        aria-label={PLACEHOLDER}
      />
    </Box>
  )
}

export default memo(SidebarSearch)
