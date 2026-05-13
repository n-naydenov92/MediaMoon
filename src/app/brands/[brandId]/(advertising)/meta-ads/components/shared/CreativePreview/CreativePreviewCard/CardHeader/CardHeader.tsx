'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import styles from '../CreativePreviewCard.module.css'

interface Props {
  readonly pageName: string
  readonly avatarUrl: string | null
}

export default function CardHeader({ pageName, avatarUrl }: Props): JSX.Element {
  const [avatarFailed, setAvatarFailed] = useState(false)
  const showImage = avatarUrl && !avatarFailed
  return (
    <Box className={styles.headerRow}>
      {showImage ? (
        <Box
          component="img"
          src={avatarUrl}
          alt=""
          className={styles.avatar}
          referrerPolicy="no-referrer"
          onError={() => setAvatarFailed(true)}
        />
      ) : (
        <Box className={styles.avatarPlaceholder} aria-hidden>
          <StorefrontOutlinedIcon fontSize="small" />
        </Box>
      )}
      <Box className={styles.headerText}>
        <Typography component="span" variant="inherit" className={styles.pageName}>{pageName}</Typography>
        <Typography component="span" variant="inherit" className={styles.sponsored}>Sponsored</Typography>
      </Box>
    </Box>
  )
}
