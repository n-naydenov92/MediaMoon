import styles from './CreativePreviewCard.module.css'

interface Props {
  readonly message: string
}

export default function CardError({ message }: Props): JSX.Element {
  return (
    <div className={styles.errorBox}>
      <span className={styles.errorTitle}>Couldn&apos;t load preview</span>
      <span className={styles.errorMessage}>{message}</span>
    </div>
  )
}
