'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import styles from './SharedFieldNote.module.css'

interface Props {
  readonly customized: number
  readonly total: number
}

// Shown under a shared copy field when some creatives carry their own value for it.
// The shared field still drives every creative that didn't diverge, so instead of
// locking it we spell out its live scope ("affects N of M"). The per-creative editor
// is reached from the section's single "Edit copy per creative" button.
export default memo(function SharedFieldNote({ customized, total }: Props): JSX.Element {
  const affected = Math.max(total - customized, 0)
  return (
    <Box className={styles.root}>
      <InfoOutlinedIcon className={styles.icon} fontSize="inherit" />
      <Typography component="span" variant="inherit" className={styles.text}>
        {`Shared · affects ${affected} of ${total}`}
      </Typography>
    </Box>
  )
})
