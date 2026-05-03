import styles from './AdThumbnail.module.css'

interface Props {
  readonly src: string | null
  readonly alt: string
  readonly type: 'image' | 'video' | 'unknown'
  readonly size?: 'sm' | 'md'
}

export default function AdThumbnail({ src, alt, type, size = 'sm' }: Props): JSX.Element {
  if (!src) {
    return (
      <div className={styles.placeholder} data-size={size} data-type={type} aria-label={alt}>
        {type === 'video' ? '▶' : '▣'}
      </div>
    )
  }
  return (
    <div className={styles.wrap} data-size={size}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className={styles.img} loading="lazy" />
      {type === 'video' && <span className={styles.badge}>▶</span>}
    </div>
  )
}
