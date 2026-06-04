'use client'

import { memo } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { CtaType } from '@/lib/gateways/MetaAdsGateway'
import { CTA_LABELS } from '../ctaOptions'
import { domainOf, initialOf, type FeedMedia } from './helpers'
import styles from './AdFeedCard.module.css'

interface Props {
  readonly pageName: string
  readonly pageAvatar: string | null
  readonly primary: string
  readonly headline: string
  readonly description: string
  readonly url: string
  readonly cta: CtaType
  readonly media: FeedMedia | null
}

// Presentational Facebook feed-card mock, shared by the read-only PreviewDialog
// and the per-creative copy editor's live preview. Holds no combinatorial logic.
export default memo(function AdFeedCard({
  pageName,
  pageAvatar,
  primary,
  headline,
  description,
  url,
  cta,
  media,
}: Props): JSX.Element {
  return (
    <Box className={styles.feedCard}>
      <Box className={styles.feedHeader}>
        {pageAvatar ? (
          <Box
            component="img"
            src={pageAvatar}
            alt={pageName}
            referrerPolicy="no-referrer"
            className={styles.feedAvatar}
          />
        ) : (
          <Box component="span" className={styles.feedAvatarFallback} aria-hidden>
            {initialOf(pageName)}
          </Box>
        )}
        <Box className={styles.feedHeaderTextWrap}>
          <Typography component="span" variant="inherit" className={styles.feedPageName}>
            {pageName}
          </Typography>
          <Typography component="span" variant="inherit" className={styles.feedSponsored}>
            Sponsored · 🌐
          </Typography>
        </Box>
      </Box>

      <Typography component="p" variant="inherit" className={styles.feedPrimaryText}>
        {primary}
      </Typography>

      <Box className={styles.feedMediaWrap}>
        {!media && <Box className={styles.feedMediaEmpty}>No media</Box>}
        {media && media.isVideo && (
          <Box
            component="video"
            src={media.url}
            className={styles.feedMedia}
            muted
            playsInline
            controls
          />
        )}
        {media && !media.isVideo && (
          <Box
            component="img"
            src={media.url}
            alt={media.name}
            className={styles.feedMedia}
          />
        )}
      </Box>

      <Box className={styles.feedFooter}>
        <Box className={styles.feedFooterText}>
          <Typography component="span" variant="inherit" className={styles.feedDomain}>
            {url ? domainOf(url) : 'yourdomain.com'}
          </Typography>
          <Typography component="span" variant="inherit" className={styles.feedHeadline}>
            {headline}
          </Typography>
          {description && (
            <Typography component="span" variant="inherit" className={styles.feedDescription}>
              {description}
            </Typography>
          )}
        </Box>
        <Box component="span" className={styles.feedCta}>
          {CTA_LABELS[cta]}
        </Box>
      </Box>

      <Box className={styles.feedActions} aria-hidden>
        <Typography component="span" variant="inherit">👍 Like</Typography>
        <Typography component="span" variant="inherit">💬 Comment</Typography>
        <Typography component="span" variant="inherit">↗ Share</Typography>
      </Box>
    </Box>
  )
})
