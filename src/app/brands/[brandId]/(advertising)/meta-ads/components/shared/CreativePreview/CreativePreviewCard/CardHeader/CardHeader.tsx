'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import styles from '../CreativePreviewCard.module.css'

interface Props {
  readonly pageName: string
  readonly avatarUrl: string | null
  readonly copyText?: string | null
}

export default function CardHeader({ pageName, avatarUrl, copyText }: Props): JSX.Element {
  const [avatarFailed, setAvatarFailed] = useState(false)
  const showImage = avatarUrl && !avatarFailed
  const text = (copyText ?? '').trim()

  const handleCopy = (): void => {
    void navigator.clipboard?.writeText(text).catch(() => undefined)
  }

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
      {text !== '' && (
        <Tooltip title="Copy primary text" placement="top" disableInteractive>
          <IconButton
            type="button"
            aria-label="Copy primary text"
            onClick={handleCopy}
            className={styles.copyBtn}
          >
            <ContentCopyOutlinedIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
