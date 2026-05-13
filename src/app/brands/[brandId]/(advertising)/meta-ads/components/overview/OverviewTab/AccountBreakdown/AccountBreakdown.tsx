import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import type { AccountSummary } from '@/lib/meta/aggregate'
import { formatEur, formatRoas } from '@/lib/meta/fx'
import { classifyRoas } from '@/lib/meta/roasClassification'
import { cssVars } from '@/lib/css'
import styles from './AccountBreakdown.module.css'

interface Props {
  readonly accounts: readonly AccountSummary[]
}

export default function AccountBreakdown({ accounts }: Props): JSX.Element {
  if (accounts.length === 0) {
    return <Box className={styles.empty}>No accounts configured for this view.</Box>
  }
  const maxSpend = Math.max(...accounts.map((a) => a.spendEur), 1)
  return (
    <List disablePadding className={styles.list}>
      {accounts.map((account) => {
        const fillPct = `${(account.spendEur / maxSpend) * 100}%`
        const adsLabel = account.activeAdsCount === 1 ? 'active ad' : 'active ads'
        return (
          <ListItem key={account.accountId} disablePadding disableGutters className={styles.row}>
            <Box className={styles.head}>
              <Typography component="span" variant="inherit" className={styles.name}>{account.accountName}</Typography>
              <Typography component="span" variant="inherit" className={styles.spend}>{formatEur(account.spendEur)}</Typography>
            </Box>
            <Box className={styles.bar} style={cssVars({ '--fill-pct': fillPct })}>
              <Box component="span" className={styles.barFill} />
            </Box>
            <Box className={styles.meta}>
              <Typography component="span" variant="inherit" className={styles.roas} data-tier={classifyRoas(account.roas)}>
                ROAS {formatRoas(account.roas)}
              </Typography>
              <Box component="span" className={styles.dot}>·</Box>
              <Typography component="span" variant="inherit">{account.activeAdsCount} {adsLabel}</Typography>
            </Box>
          </ListItem>
        )
      })}
    </List>
  )
}
