import styles from './CreativePreviewCard.module.css'

interface Props {
  readonly videoUrl: string | null
  readonly videoThumbnail: string | null
  readonly imageUrl: string | null
  readonly alt: string
}

export default function CardMedia({
  videoUrl,
  videoThumbnail,
  imageUrl,
  alt,
}: Props): JSX.Element | null {
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
  if (!src) {
    return null
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={styles.media} />
  )
}
