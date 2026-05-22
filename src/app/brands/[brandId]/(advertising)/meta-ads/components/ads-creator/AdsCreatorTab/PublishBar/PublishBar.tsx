'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import styles from './PublishBar.module.css'

interface Props {
  readonly filesCount: number
  readonly canSubmit: boolean
  readonly onSubmit: () => void
}

export default memo(function PublishBar({ filesCount, canSubmit, onSubmit }: Props): JSX.Element {
  const label = filesCount === 0
    ? 'Publish ads'
    : `Publish ${filesCount} ${filesCount === 1 ? 'ad' : 'ads'}`
  return (
    <Box className={styles.root}>
      <Button
        type="button"
        variant="contained"
        disableElevation
        fullWidth
        size="large"
        startIcon={<PlayArrowIcon />}
        className={styles.button}
        disabled={!canSubmit}
        onClick={onSubmit}
      >
        {label}
      </Button>
    </Box>
  )
})
