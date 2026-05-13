'use client'

import { useState } from 'react'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import styles from '../CreativePreviewCard/CreativePreviewCard.module.css'

interface Props {
  readonly pageName: string
  readonly avatarUrl: string | null
}

export default function CardHeader({ pageName, avatarUrl }: Props): JSX.Element {
  const [avatarFailed, setAvatarFailed] = useState(false)
  const showImage = avatarUrl && !avatarFailed
  return (
    <div className={styles.headerRow}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className={styles.avatar}
          referrerPolicy="no-referrer"
          onError={() => setAvatarFailed(true)}
        />
      ) : (
        <div className={styles.avatarPlaceholder} aria-hidden>
          <StorefrontOutlinedIcon fontSize="small" />
        </div>
      )}
      <div className={styles.headerText}>
        <span className={styles.pageName}>{pageName}</span>
        <span className={styles.sponsored}>Sponsored</span>
      </div>
    </div>
  )
}
