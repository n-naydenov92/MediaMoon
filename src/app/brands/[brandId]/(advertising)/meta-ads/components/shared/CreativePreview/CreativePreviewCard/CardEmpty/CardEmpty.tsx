import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { CreativePreviewData } from '../../creativePreviewTypes'
import styles from '../CreativePreviewCard.module.css'

interface Props {
  readonly data: CreativePreviewData
}

export default function CardEmpty({ data }: Props): JSX.Element {
  return (
    <Box className={styles.errorBox}>
      <Typography component="span" variant="inherit" className={styles.errorTitle}>{data.adName || 'Preview unavailable'}</Typography>
      <Typography component="span" variant="inherit" className={styles.errorMessage}>
        Meta returned no preview data for this ad (likely a deleted post or restricted creative).
      </Typography>
    </Box>
  )
}
