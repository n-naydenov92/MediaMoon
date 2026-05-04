'use client'

import { memo, useState } from 'react'
import Popper from '@mui/material/Popper'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import { useThemeMode } from '@/styles/useThemeMode'
import type { CreativePreviewData, CreativePreviewState } from './creativePreviewTypes'
import styles from './CreativePreviewCard.module.css'

interface Props {
  readonly anchor: HTMLElement | null
  readonly state: CreativePreviewState
  readonly onPointerEnter: () => void
  readonly onPointerLeave: () => void
}

const POPPER_MODIFIERS = [
  { name: 'offset', options: { offset: [0, 12] } },
  { name: 'preventOverflow', options: { padding: 16 } },
  { name: 'flip', options: { fallbackPlacements: ['left', 'top', 'bottom'] } },
]

const BODY_TRUNCATE_THRESHOLD = 220

const CreativePreviewCard = memo(function CreativePreviewCard({
  anchor,
  state,
  onPointerEnter,
  onPointerLeave,
}: Props): JSX.Element | null {
  const { mode } = useThemeMode()
  if (!anchor || state.status === 'idle') {
    return null
  }
  return (
    <Popper
      open
      anchorEl={anchor}
      placement="right-start"
      modifiers={POPPER_MODIFIERS}
      style={{ zIndex: 1300 }}
    >
      <div
        className={styles.card}
        data-theme={mode}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        role="dialog"
      >
        {state.status === 'loading' && <CardSkeleton />}
        {state.status === 'error' && <CardError message={state.message} />}
        {state.status === 'success' && <CardContent data={state.data} />}
        {state.status === 'no-content' && <CardEmpty data={state.data} />}
      </div>
    </Popper>
  )
})

export default CreativePreviewCard

function CardSkeleton(): JSX.Element {
  return (
    <>
      <div className={styles.headerRow}>
        <div className={`${styles.avatar} ${styles.skeletonBlock}`} />
        <div className={styles.headerText}>
          <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonLineNarrow}`} />
        </div>
      </div>
      <div className={`${styles.skeletonBody} ${styles.skeletonBlock}`} />
      <div className={`${styles.skeletonMedia} ${styles.skeletonBlock}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineWide}`} />
    </>
  )
}

function CardError({ message }: { readonly message: string }): JSX.Element {
  return (
    <div className={styles.errorBox}>
      <span className={styles.errorTitle}>Couldn&apos;t load preview</span>
      <span className={styles.errorMessage}>{message}</span>
    </div>
  )
}

function CardEmpty({ data }: { readonly data: CreativePreviewData }): JSX.Element {
  return (
    <div className={styles.errorBox}>
      <span className={styles.errorTitle}>{data.adName || 'Preview unavailable'}</span>
      <span className={styles.errorMessage}>
        Meta returned no preview data for this ad (likely a deleted post or restricted creative).
      </span>
    </div>
  )
}

function CardContent({ data }: { readonly data: CreativePreviewData }): JSX.Element {
  return (
    <>
      <CardHeader pageName={data.pageName ?? data.adName} avatarUrl={data.pageAvatarUrl} />
      {data.body && <CardBody body={data.body} />}
      <CardMedia
        videoUrl={data.videoUrl}
        videoThumbnail={data.videoThumbnail}
        imageUrl={data.imageUrl}
        alt={data.adName}
      />
      <CardFooter
        headline={data.headline}
        description={data.description}
        callToAction={data.callToAction ?? 'Learn more'}
        adName={data.adName}
      />
    </>
  )
}

function CardHeader({
  pageName,
  avatarUrl,
}: {
  readonly pageName: string
  readonly avatarUrl: string | null
}): JSX.Element {
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

function CardBody({ body }: { readonly body: string }): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const isLong = body.length > BODY_TRUNCATE_THRESHOLD
  return (
    <div className={styles.body} data-expanded={expanded}>
      <p className={styles.bodyText}>{body}</p>
      {isLong && !expanded && (
        <button type="button" className={styles.seeMore} onClick={() => setExpanded(true)}>
          See more
        </button>
      )}
    </div>
  )
}

function CardMedia({
  videoUrl,
  videoThumbnail,
  imageUrl,
  alt,
}: {
  readonly videoUrl: string | null
  readonly videoThumbnail: string | null
  readonly imageUrl: string | null
  readonly alt: string
}): JSX.Element | null {
  if (videoUrl) {
    return (
      <video
        className={styles.media}
        src={videoUrl}
        poster={videoThumbnail ?? undefined}
        controls
        muted
        playsInline
        preload="metadata"
      />
    )
  }
  const src = imageUrl ?? videoThumbnail
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={styles.media} />
    )
  }
  return null
}

function CardFooter({
  headline,
  description,
  callToAction,
  adName,
}: {
  readonly headline: string | null
  readonly description: string | null
  readonly callToAction: string
  readonly adName: string
}): JSX.Element {
  const visibleHeadline = headline ?? (adName.trim().length > 0 ? adName : null)
  return (
    <div className={styles.footer}>
      <div className={styles.footerText}>
        {visibleHeadline && <span className={styles.headline}>{visibleHeadline}</span>}
        {description && <span className={styles.description}>{description}</span>}
      </div>
      <span className={styles.cta}>{callToAction}</span>
    </div>
  )
}
