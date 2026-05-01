'use client'

import { memo } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import styles from './SidebarSearch.module.css'

const PLACEHOLDER = 'Search modules…'

interface Props {
  readonly value: string
  readonly onChange: (next: string) => void
}

export default memo(function SidebarSearch({ value, onChange }: Props): JSX.Element {
  return (
    <div className={styles.root}>
      <SearchIcon className={styles.icon} fontSize="small" aria-hidden="true" />
      <input
        type="text"
        className={styles.input}
        placeholder={PLACEHOLDER}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={PLACEHOLDER}
      />
    </div>
  )
})
