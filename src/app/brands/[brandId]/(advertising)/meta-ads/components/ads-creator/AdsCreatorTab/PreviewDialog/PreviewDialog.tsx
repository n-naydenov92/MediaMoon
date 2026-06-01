'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { CtaType, Page } from '@/lib/gateways/MetaAdsGateway'
import type { CopyValue } from '../CopyForm/CopyForm'
import { computeCombo, domainOf, initialOf, type FilePreview } from './helpers'
import styles from './PreviewDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly copy: CopyValue
  readonly files: readonly File[]
  readonly pages: readonly Page[]
}

const CTA_LABELS: Record<CtaType, string> = {
  LEARN_MORE: 'Learn more',
  SHOP_NOW: 'Shop now',
  SIGN_UP: 'Sign up',
}

export default memo(function PreviewDialog({
  open,
  onClose,
  copy,
  files,
  pages,
}: Props): JSX.Element {
  const fullScreen = useMediaQuery('(max-width: 600px)')
  const [index, setIndex] = useState(0)

  const filledPrimary = useMemo(
    () => copy.primaryTexts.filter((t) => t.trim().length > 0),
    [copy.primaryTexts],
  )
  const filledHeadlines = useMemo(
    () => copy.headlines.filter((t) => t.trim().length > 0),
    [copy.headlines],
  )

  const filePreviews = useMemo<readonly FilePreview[]>(
    () => files.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      isVideo: file.type.startsWith('video/'),
    })),
    [files],
  )

  useEffect(() => () => {
    for (const p of filePreviews) URL.revokeObjectURL(p.url)
  }, [filePreviews])

  const pageCount = Math.max(1, pages.length)
  const total = pageCount * filePreviews.length * filledHeadlines.length * filledPrimary.length

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  const safeIndex = total === 0 ? 0 : Math.min(index, total - 1)

  const combo = useMemo(
    () => computeCombo(safeIndex, total, pages, filePreviews, filledHeadlines, filledPrimary),
    [total, safeIndex, pages, filePreviews, filledHeadlines, filledPrimary],
  )

  const handlePrev = (): void => {
    setIndex((i) => Math.max(0, i - 1))
  }
  const handleNext = (): void => {
    setIndex((i) => Math.min(total - 1, i + 1))
  }

  const pageName = combo?.page?.name ?? 'Your page'
  const pageAvatar = combo?.page?.pictureUrl ?? null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="xs"
      fullWidth
      aria-labelledby="ad-preview-title"
      classes={{ paper: styles.paper }}
    >
      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <VisibilityOutlinedIcon className={styles.headerIcon} fontSize="inherit" />
          <Typography
            id="ad-preview-title"
            component="h2"
            variant="inherit"
            className={styles.headerTitle}
          >
            Ad preview
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box className={styles.body}>
        {combo ? (
          <>
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
                {combo.primary}
              </Typography>

              <Box className={styles.feedMediaWrap}>
                {combo.file.isVideo ? (
                  <Box
                    component="video"
                    src={combo.file.url}
                    className={styles.feedMedia}
                    muted
                    playsInline
                    controls
                  />
                ) : (
                  <Box
                    component="img"
                    src={combo.file.url}
                    alt={combo.file.name}
                    className={styles.feedMedia}
                  />
                )}
              </Box>

              <Box className={styles.feedFooter}>
                <Box className={styles.feedFooterText}>
                  <Typography component="span" variant="inherit" className={styles.feedDomain}>
                    {copy.url ? domainOf(copy.url) : 'yourdomain.com'}
                  </Typography>
                  <Typography component="span" variant="inherit" className={styles.feedHeadline}>
                    {combo.headline}
                  </Typography>
                  {copy.description && (
                    <Typography component="span" variant="inherit" className={styles.feedDescription}>
                      {copy.description}
                    </Typography>
                  )}
                </Box>
                <Box component="span" className={styles.feedCta}>
                  {CTA_LABELS[copy.cta]}
                </Box>
              </Box>

              <Box className={styles.feedActions} aria-hidden>
                <Typography component="span" variant="inherit">👍 Like</Typography>
                <Typography component="span" variant="inherit">💬 Comment</Typography>
                <Typography component="span" variant="inherit">↗ Share</Typography>
              </Box>
            </Box>
          </>
        ) : (
          <Box className={styles.empty}>
            <Typography component="span" variant="inherit">
              Nothing to preview yet.
            </Typography>
            <Typography component="span" variant="inherit">
              Add at least 1 Primary Text, 1 Headline, and 1 file.
            </Typography>
          </Box>
        )}
      </Box>

      <Box component="footer" className={styles.footer}>
        <Box className={styles.nav}>
          <Box
            component="button"
            type="button"
            className={styles.navButton}
            onClick={handlePrev}
            disabled={total === 0 || safeIndex === 0}
          >
            <ChevronLeftIcon fontSize="small" />
            Previous
          </Box>
          <Typography component="span" variant="inherit" className={styles.counter}>
            {total === 0 ? '0 / 0' : `${safeIndex + 1} / ${total}`}
          </Typography>
          <Box
            component="button"
            type="button"
            className={styles.navButton}
            onClick={handleNext}
            disabled={total === 0 || safeIndex >= total - 1}
          >
            Next
            <ChevronRightIcon fontSize="small" />
          </Box>
        </Box>
        <Button type="button" variant="text" onClick={onClose} className={styles.closeAction}>
          Close
        </Button>
      </Box>
    </Dialog>
  )
})
