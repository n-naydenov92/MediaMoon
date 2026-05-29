'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import styles from './CrossPublishInfo.module.css'

interface Props {
  readonly pagesCount: number
  readonly filesCount: number
}

export default memo(function CrossPublishInfo({
  pagesCount,
  filesCount,
}: Props): JSX.Element | null {
  if (pagesCount === 0 || filesCount === 0) {
    return null
  }
  const total = pagesCount * filesCount
  const adsLabel = total === 1 ? 'ad' : 'ads'
  const pagesLabel = pagesCount === 1 ? 'page' : 'pages'
  const filesLabel = filesCount === 1 ? 'file' : 'files'

  return (
    <Box className={styles.root} role="status">
      <InfoOutlinedIcon fontSize="small" className={styles.icon} aria-hidden />
      <Typography component="span" variant="inherit" className={styles.text}>
        <Typography component="span" variant="inherit" className={styles.formula}>
          {pagesCount} {pagesLabel} × {filesCount} {filesLabel}
        </Typography>
        {' = '}
        <Typography component="span" variant="inherit" className={styles.total}>
          {total} {adsLabel}
        </Typography>
        {' will be published'}
      </Typography>
    </Box>
  )
})
