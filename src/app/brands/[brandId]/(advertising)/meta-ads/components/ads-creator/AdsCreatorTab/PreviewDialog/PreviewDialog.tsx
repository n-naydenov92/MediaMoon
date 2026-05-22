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
import styles from './PreviewDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly copy: CopyValue
  readonly files: readonly File[]
  readonly page: Page | null
}

interface FilePreview {
  readonly url: string
  readonly name: string
  readonly isVideo: boolean
}

const CTA_LABELS: Record<CtaType, string> = {
  LEARN_MORE: 'Learn more',
  SHOP_NOW: 'Shop now',
  SIGN_UP: 'Sign up',
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function initialOf(name: string): string {
  const trimmed = name.trim()
  return trimmed.length > 0 ? trimmed[0]!.toUpperCase() : '?'
}

export default memo(function PreviewDialog({
  open,
  onClose,
  copy,
  files,
  page,
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

  const total = filledPrimary.length * filledHeadlines.length * filePreviews.length

  useEffect(() => {
    if (open) setIndex(0)
  }, [open])

  const safeIndex = total === 0 ? 0 : Math.min(index, total - 1)

  const combo = useMemo(() => {
    if (total === 0) return null
    const fileCount = filePreviews.length
    const headlineCount = filledHeadlines.length
    const fileIdx = safeIndex % fileCount
    const headlineIdx = Math.floor(safeIndex / fileCount) % headlineCount
    const primaryIdx = Math.floor(safeIndex / (fileCount * headlineCount))
    return {
      primary: filledPrimary[primaryIdx]!,
      headline: filledHeadlines[headlineIdx]!,
      file: filePreviews[fileIdx]!,
      primaryIdx,
      headlineIdx,
      fileIdx,
    }
  }, [total, safeIndex, filePreviews, filledHeadlines, filledPrimary])

  const handlePrev = (): void => {
    setIndex((i) => Math.max(0, i - 1))
  }
  const handleNext = (): void => {
    setIndex((i) => Math.min(total - 1, i + 1))
  }

  const pageName = page?.name ?? 'Your page'
  const pageAvatar = page?.pictureUrl ?? null

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
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
            <Box className={styles.summary}>
              <Box className={styles.summaryRow}>
                <Typography component="span" variant="inherit" className={styles.summaryLabel}>
                  Primary Text
                </Typography>
                <Typography component="span" variant="inherit" className={styles.summaryValue}>
                  {filledPrimary.length === 1
                    ? 'Main'
                    : `${combo.primaryIdx === 0 ? 'Main' : `Variation ${combo.primaryIdx}`} (${combo.primaryIdx + 1}/${filledPrimary.length})`}
                </Typography>
              </Box>
              <Box className={styles.summaryRow}>
                <Typography component="span" variant="inherit" className={styles.summaryLabel}>
                  Headline
                </Typography>
                <Typography component="span" variant="inherit" className={styles.summaryValue}>
                  {filledHeadlines.length === 1
                    ? 'Main'
                    : `${combo.headlineIdx === 0 ? 'Main' : `Variation ${combo.headlineIdx}`} (${combo.headlineIdx + 1}/${filledHeadlines.length})`}
                </Typography>
              </Box>
              <Box className={styles.summaryRow}>
                <Typography component="span" variant="inherit" className={styles.summaryLabel}>
                  Creative
                </Typography>
                <Typography component="span" variant="inherit" className={styles.summaryValue}>
                  {`${combo.file.name} (${combo.fileIdx + 1}/${filePreviews.length})`}
                </Typography>
              </Box>
            </Box>

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
