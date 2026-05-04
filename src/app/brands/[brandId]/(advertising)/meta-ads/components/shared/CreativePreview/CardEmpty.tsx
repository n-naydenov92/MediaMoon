import type { CreativePreviewData } from './creativePreviewTypes'
import styles from './CreativePreviewCard.module.css'

interface Props {
  readonly data: CreativePreviewData
}

export default function CardEmpty({ data }: Props): JSX.Element {
  return (
    <div className={styles.errorBox}>
      <span className={styles.errorTitle}>{data.adName || 'Preview unavailable'}</span>
      <span className={styles.errorMessage}>
        Meta returned no preview data for this ad (likely a deleted post or restricted creative).
      </span>
    </div>
  )
}
