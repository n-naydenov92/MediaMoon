'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import styles from './SharedFieldNote.module.css'

interface Props {
  readonly count: number
  readonly onManage: () => void
}

// Shown under a shared copy field when some creatives carry their own value for it.
// The shared field still drives every creative that didn't diverge — this just says
// so and offers the per-creative editor, rather than locking the field.
export default memo(function SharedFieldNote({ count, onManage }: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <InfoOutlinedIcon className={styles.icon} fontSize="inherit" />
      <Typography component="span" variant="inherit" className={styles.text}>
        {`Shared · ${count} customized`}
      </Typography>
      <Button
        type="button"
        size="small"
        variant="text"
        onClick={onManage}
        className={styles.action}
      >
        Edit per creative
      </Button>
    </Box>
  )
})
