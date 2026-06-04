'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import type { CopyValue } from '../CopyForm/CopyForm'
import AdFeedCard from '../AdFeedCard/AdFeedCard'
import CreatorDialog from '../CreatorDialog/CreatorDialog'
import type { FeedMedia } from '../AdFeedCard/helpers'
import { computeCombo } from './helpers'
import styles from './PreviewDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly copy: CopyValue
  readonly files: readonly File[]
  readonly pages: readonly Page[]
}

export default memo(function PreviewDialog({
  open,
  onClose,
  copy,
  files,
  pages,
}: Props): JSX.Element {
  const [index, setIndex] = useState(0)

  const filledPrimary = useMemo(
    () => copy.primaryTexts.filter((t) => t.trim().length > 0),
    [copy.primaryTexts],
  )
  const filledHeadlines = useMemo(
    () => copy.headlines.filter((t) => t.trim().length > 0),
    [copy.headlines],
  )

  const filePreviews = useMemo<readonly FeedMedia[]>(
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
    <CreatorDialog
      open={open}
      onClose={onClose}
      icon={<VisibilityOutlinedIcon fontSize="inherit" />}
      title="Ad preview"
      titleId="ad-preview-title"
      maxWidth="xs"
      paperClassName={styles.paper}
      footer={(
        <Box className={styles.footerInner}>
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
      )}
    >
      <Box className={styles.body}>
        {combo ? (
          <AdFeedCard
            pageName={pageName}
            pageAvatar={pageAvatar}
            primary={combo.primary}
            headline={combo.headline}
            description={copy.description}
            url={copy.url}
            cta={copy.cta}
            media={combo.file}
          />
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
    </CreatorDialog>
  )
})
