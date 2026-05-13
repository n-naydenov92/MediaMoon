import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
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
    <Box className={styles.footer}>
      <Box className={styles.footerText}>
        {visibleHeadline && <Typography component="span" variant="inherit" className={styles.headline}>{visibleHeadline}</Typography>}
        {description && <Typography component="span" variant="inherit" className={styles.description}>{description}</Typography>}
      </Box>
      <Typography component="span" variant="inherit" className={styles.cta}>{callToAction}</Typography>
    </Box>
  )
}
