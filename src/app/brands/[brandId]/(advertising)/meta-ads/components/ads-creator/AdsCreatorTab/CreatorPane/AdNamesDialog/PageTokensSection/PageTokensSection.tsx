'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Collapse from '@mui/material/Collapse'
import Typography from '@mui/material/Typography'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import FormTextField from '../../../FormTextField/FormTextField'
import { pageToken } from '../../helpers'
import styles from '../AdNamesDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onToggle: () => void
  readonly selectedPages: readonly Page[]
  readonly pageTokens: ReadonlyMap<string, string>
  readonly onPageTokChange: (page: Page, value: string) => void
}

export default memo(function PageTokensSection({
  open,
  onToggle,
  selectedPages,
  pageTokens,
  onPageTokChange,
}: Props): JSX.Element {
  return (
    <Box className={styles.bulk}>
      <Box
        component="button"
        type="button"
        className={styles.bulkToggle}
        onClick={onToggle}
        aria-expanded={open}
      >
        <LabelOutlinedIcon className={styles.bulkIcon} fontSize="inherit" />
        <Typography component="span" variant="inherit" className={styles.bulkTitle}>
          Page names — appended to every name
        </Typography>
        <ExpandMoreIcon className={styles.chevron} data-open={open ? 'true' : 'false'} fontSize="inherit" />
      </Box>
      <Collapse in={open} timeout={180} unmountOnExit>
        <Box className={styles.pageRows}>
          {selectedPages.map((page) => (
            <Box key={page.id} className={styles.pageRow}>
              {page.pictureUrl ? (
                <Box
                  component="img"
                  src={page.pictureUrl}
                  alt=""
                  referrerPolicy="no-referrer"
                  className={styles.pageAvatar}
                />
              ) : (
                <Box component="span" className={styles.pageAvatarFallback} aria-hidden>
                  <PublicOutlinedIcon fontSize="inherit" />
                </Box>
              )}
              <Typography component="span" variant="inherit" className={styles.pageRowName}>
                {page.name}
              </Typography>
              <FormTextField
                className={styles.pageTokenField}
                placeholder={pageToken(page.name)}
                value={pageTokens.has(page.id) ? (pageTokens.get(page.id) ?? '') : pageToken(page.name)}
                onChange={(e) => onPageTokChange(page, e.target.value)}
              />
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
})
