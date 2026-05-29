'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined'
import styles from './SourceRows.module.css'

interface Props {
  readonly sourceCampaignName: string
  readonly sourceAdSetName: string
}

export default memo(function SourceRows({
  sourceCampaignName,
  sourceAdSetName,
}: Props): JSX.Element {
  return (
    <Box className={styles.root}>
      <Box className={styles.field}>
        <Typography component="span" variant="inherit" className={styles.label}>
          Source campaign
        </Typography>
        <Box className={styles.value}>
          <CampaignOutlinedIcon className={styles.icon} fontSize="inherit" />
          <Tooltip title={sourceCampaignName} placement="top" disableInteractive enterDelay={400}>
            <Typography component="span" variant="inherit" className={styles.text}>
              {sourceCampaignName}
            </Typography>
          </Tooltip>
        </Box>
      </Box>

      <Box className={styles.field}>
        <Typography component="span" variant="inherit" className={styles.label}>
          Source ad set
        </Typography>
        <Box className={styles.value}>
          <AdsClickOutlinedIcon className={styles.icon} fontSize="inherit" />
          <Tooltip title={sourceAdSetName} placement="top" disableInteractive enterDelay={400}>
            <Typography component="span" variant="inherit" className={styles.text}>
              {sourceAdSetName}
            </Typography>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  )
})
