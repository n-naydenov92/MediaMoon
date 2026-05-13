import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import styles from '../CreativePreviewCard.module.css'

interface Props {
  readonly message: string
}

export default function CardError({ message }: Props): JSX.Element {
  return (
    <Box className={styles.errorBox}>
      <Typography component="span" variant="inherit" className={styles.errorTitle}>Couldn&apos;t load preview</Typography>
      <Typography component="span" variant="inherit" className={styles.errorMessage}>{message}</Typography>
    </Box>
  )
}
