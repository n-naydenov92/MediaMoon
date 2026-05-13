import { memo } from 'react'
import Box from '@mui/material/Box'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import Typography from '@mui/material/Typography'
import type { Campaign } from '@/lib/gateways/MetaAdsGateway'
import { toneFor } from './helpers'
import styles from './CampaignsList.module.css'

interface Props {
  readonly campaigns: readonly Campaign[]
}

export default memo(function CampaignsList({ campaigns }: Props): JSX.Element {
  return (
    <Box component="section" className={styles.section}>
      <Box component="header" className={styles.header}>
        <Typography component="h2" variant="inherit" className={styles.heading}>
          Campaigns
        </Typography>
        <Typography component="span" variant="inherit" className={styles.count}>
          {campaigns.length}
        </Typography>
      </Box>

      {campaigns.length === 0 ? (
        <Box className={styles.empty}>No campaigns in this ad account.</Box>
      ) : (
        <List disablePadding className={styles.list}>
          {campaigns.map((campaign) => (
            <ListItem
              key={campaign.id}
              disablePadding
              disableGutters
              className={styles.item}
            >
              <Box className={styles.titleRow}>
                <Typography component="span" variant="inherit" className={styles.name}>
                  {campaign.name}
                </Typography>
                <Typography
                  component="span"
                  variant="inherit"
                  className={styles.status}
                  data-tone={toneFor(campaign.effectiveStatus)}
                >
                  {campaign.effectiveStatus}
                </Typography>
              </Box>
              <Typography component="span" variant="inherit" className={styles.id}>
                {campaign.id}
              </Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )
})
