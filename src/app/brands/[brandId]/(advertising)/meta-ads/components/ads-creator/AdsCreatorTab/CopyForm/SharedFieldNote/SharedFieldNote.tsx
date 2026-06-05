'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import styles from './SharedFieldNote.module.css'

interface Props {
  readonly customized: number
  readonly total: number
}

// Compact scope chip shown on a shared copy field's label row when some creatives
// carry their own value for it. The shared field still drives every creative that
// didn't diverge, so instead of locking it we spell out its live scope ("N of M").
// The per-creative editor is reached from the section's "Edit per creative" button.
export default memo(function SharedFieldNote({ customized, total }: Props): JSX.Element {
  const affected = Math.max(total - customized, 0)
  const tip = `This field is shared. ${affected} of ${total} ${affected === 1 ? 'creative uses' : 'creatives use'} it`
    + `, while ${customized} ${customized === 1 ? 'has' : 'have'} a custom value.`
    + ' Open “Edit per creative” to change them individually.'
  return (
    <Tooltip title={tip} placement="top" disableInteractive>
      <Box component="span" className={styles.root}>
        <InfoOutlinedIcon className={styles.icon} fontSize="inherit" />
        <Typography component="span" variant="inherit" className={styles.text}>
          {`Shared · ${affected} of ${total}`}
        </Typography>
      </Box>
    </Tooltip>
  )
})
