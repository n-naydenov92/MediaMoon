import styles from '../CreativePreviewCard.module.css'

interface Props {
  readonly headline: string | null
  readonly description: string | null
  readonly callToAction: string
  readonly adName: string
}

export default function CardFooter({
  headline,
  description,
  callToAction,
  adName,
}: Props): JSX.Element {
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
