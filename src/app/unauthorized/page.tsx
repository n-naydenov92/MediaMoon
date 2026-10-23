import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Link from 'next/link'
import Button from '@mui/material/Button'
import styles from './page.module.css'

export default function UnauthorizedPage(): JSX.Element {
  return (
    <Box className={styles.root}>
      <Alert severity="warning" variant="outlined">
        <AlertTitle>Access denied</AlertTitle>
        You don&apos;t have permission to view this module. If you believe this is a mistake,
        contact your administrator.
      </Alert>
      <Box className={styles.actions}>
        <Link href="/">
          <Button variant="outlined">Back</Button>
        </Link>
      </Box>
    </Box>
  )
}
