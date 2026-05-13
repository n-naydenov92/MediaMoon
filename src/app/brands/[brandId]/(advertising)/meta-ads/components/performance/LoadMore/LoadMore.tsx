'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import styles from './LoadMore.module.css'

interface Props {
  readonly remaining: number
  readonly loading: boolean
  readonly onClick: () => void
}

export default function LoadMore({ remaining, loading, onClick }: Props): JSX.Element | null {
  if (remaining <= 0) {
    return null
  }
  return (
    <Box className={styles.root}>
      <Button
        variant="outlined"
        color="inherit"
        size="medium"
        onClick={onClick}
        disabled={loading}
        className={styles.btn}
      >
        {loading
          ? 'Loading…'
          : `Load more · ${remaining.toLocaleString('en-GB')} remaining`}
      </Button>
    </Box>
  )
}
