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
// carry their own value for it. It spells out how many creatives still use the shared
// value ("used in X of N") — including the all-diverged case ("used in 0 of N"), which
// is exactly when an empty shared box would otherwise read as a missing value. The
// per-creative editor is reached from the section's "Edit per creative" button.
export default memo(function SharedFieldNote({ customized, total }: Props): JSX.Element {
  const affected = Math.max(total - customized, 0)
  let tip: string
  if (affected === 0) {
    tip = 'Every creative has its own value for this field, so this shared value is unused.'
      + ' Open “Edit per creative” to change them.'
  } else if (customized === 0) {
    tip = `This shared value applies to all ${total} creatives.`
      + ' Open “Edit per creative” to give any of them a custom value.'
  } else {
    tip = `This shared value applies to ${affected} of ${total} ${affected === 1 ? 'creative' : 'creatives'}`
      + `; the other ${customized} ${customized === 1 ? 'has' : 'have'} a custom value.`
      + ' Open “Edit per creative” to change them individually.'
  }
  return (
    <Tooltip title={tip} placement="top" disableInteractive>
      <Box component="span" className={styles.root}>
        <InfoOutlinedIcon className={styles.icon} fontSize="inherit" />
        <Typography component="span" variant="inherit" className={styles.text}>
          {`Used in ${affected} of ${total} creatives`}
        </Typography>
      </Box>
    </Tooltip>
  )
})
