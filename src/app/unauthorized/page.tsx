import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import Link from 'next/link'
import Button from '@mui/material/Button'

export default function UnauthorizedPage(): JSX.Element {
  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', mt: 16, px: 6 }}>
      <Alert severity="warning" variant="outlined">
        <AlertTitle>Access denied</AlertTitle>
        You don&apos;t have permission to view this module. If you believe this is a mistake,
        contact your administrator.
      </Alert>
      <Box sx={{ mt: 6, display: 'flex', justifyContent: 'flex-end' }}>
        <Link href="/">
          <Button variant="outlined">Back</Button>
        </Link>
      </Box>
    </Box>
  )
}
