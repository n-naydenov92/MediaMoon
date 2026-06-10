import { memo, type CSSProperties } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { accountStatusInfo, type AdAccount } from '@/lib/gateways/MetaAdsGateway'
import styles from './AdAccountSummary.module.css'

interface Props {
  readonly account: AdAccount
  readonly brandColor: string
}

export default memo(function AdAccountSummary({ account, brandColor }: Props): JSX.Element {
  const status = accountStatusInfo(account.accountStatus)
  const cssVars = { '--brand-color': brandColor } as CSSProperties

  return (
    <Box className={styles.card} style={cssVars}>
      <Box className={styles.accent} />
      <Box className={styles.body}>
        <Box className={styles.titleRow}>
          <Typography component="span" variant="inherit" className={styles.name}>
            {account.name}
          </Typography>
          <Typography
            component="span"
            variant="inherit"
            className={styles.status}
            data-tone={status.tone}
          >
            {status.label}
          </Typography>
        </Box>
        <Box className={styles.metaRow}>
          <Typography component="span" variant="inherit" className={styles.id}>
            {account.id}
          </Typography>
          <Box component="span" className={styles.dot}>•</Box>
          <Typography component="span" variant="inherit" className={styles.currency}>
            {account.currency}
          </Typography>
          <Box component="span" className={styles.dot}>•</Box>
          <Typography component="span" variant="inherit" className={styles.timezone}>
            {account.timezoneName}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
})
