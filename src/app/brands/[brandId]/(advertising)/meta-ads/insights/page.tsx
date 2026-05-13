import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import styles from '../page.module.css'

export default function InsightsPage(): JSX.Element {
  return (
    <Box component="section" className={styles.root}>
      <Box className={styles.notice} data-variant="info">
        <Typography component="strong" variant="inherit">Coming next</Typography>
        <Typography variant="body2">Audience / placement / age &amp; gender breakdowns — landing after Overview ships.</Typography>
      </Box>
    </Box>
  )
}
