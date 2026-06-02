'use client'

import { memo, useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import LabelOutlinedIcon from '@mui/icons-material/LabelOutlined'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import MovieOutlinedIcon from '@mui/icons-material/MovieOutlined'
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import {
  type AdNameTags,
  EMPTY_AD_NAME_TAGS,
  adNameMapKey,
  buildAdNameFromTags,
  buildAutoAdName,
  mediaToken,
  pageToken,
  resolvePageToken,
} from '../helpers'
import styles from './AdNamesDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly files: readonly File[]
  readonly selectedPages: readonly Page[]
  readonly names: ReadonlyMap<string, string>
  readonly onChange: (next: ReadonlyMap<string, string>) => void
  readonly pageTokens: ReadonlyMap<string, string>
  readonly onPageTokensChange: (next: ReadonlyMap<string, string>) => void
}

export default memo(function AdNamesDialog({
  open,
  onClose,
  files,
  selectedPages,
  names,
  onChange,
  pageTokens,
  onPageTokensChange,
}: Props): JSX.Element {
  const fullScreen = useMediaQuery('(max-width: 600px)')
  const multiPage = selectedPages.length > 1
  const pageCount = Math.max(selectedPages.length, 1)
  const adsCount = files.length * pageCount

  const [bulkOpen, setBulkOpen] = useState(false)
  const toggleBulk = useCallback(() => setBulkOpen((v) => !v), [])
  const [pageNamesOpen, setPageNamesOpen] = useState(false)
  const togglePageNames = useCallback(() => setPageNamesOpen((v) => !v), [])
  const [tags, setTags] = useState<AdNameTags>(EMPTY_AD_NAME_TAGS)
  const tagsEmpty = tags.product === '' && tags.creativeInfo === '' && tags.textType === ''
  const [fullName, setFullName] = useState('')

  const resolveTok = useCallback(
    (page: Page) => resolvePageToken(pageTokens, page.id, page.name),
    [pageTokens],
  )

  const handleApplyTags = useCallback(() => {
    const next = new Map<string, string>()
    for (const page of selectedPages) {
      for (const file of files) {
        next.set(adNameMapKey(page.id, file), buildAdNameFromTags(file, resolveTok(page), tags))
      }
    }
    onChange(next)
  }, [files, onChange, resolveTok, selectedPages, tags])

  // Apply one full name to every ad; the page token is always appended last.
  const handleApplyFullName = useCallback(() => {
    const trimmed = fullName.trim()
    if (trimmed === '') {
      return
    }
    const next = new Map<string, string>()
    for (const page of selectedPages) {
      const tok = resolveTok(page)
      for (const file of files) {
        next.set(adNameMapKey(page.id, file), tok ? `${trimmed}-${tok}` : trimmed)
      }
    }
    onChange(next)
  }, [files, fullName, onChange, resolveTok, selectedPages])

  const setName = useCallback((key: string, value: string, fallback: string) => {
    const next = new Map(names)
    if (value === '' || value === fallback) {
      next.delete(key)
    } else {
      next.set(key, value)
    }
    onChange(next)
  }, [names, onChange])

  // Store the raw value (including empty) once touched, so the field is freely
  // editable — page naming is optional, an empty token just omits it. Also
  // re-stamp the token on already-set ad names for this page so the change
  // applies live (only on names that still carry the old token — manual edits
  // are left alone).
  const setPageTok = useCallback((page: Page, value: string) => {
    const oldTok = resolvePageToken(pageTokens, page.id, page.name)
    const nextTokens = new Map(pageTokens)
    nextTokens.set(page.id, value)
    onPageTokensChange(nextTokens)

    if (oldTok === value) {
      return
    }
    let changed = false
    const nextNames = new Map(names)
    for (const file of files) {
      const key = adNameMapKey(page.id, file)
      const current = names.get(key)
      if (current === undefined || !oldTok || !current.endsWith(`-${oldTok}`)) {
        continue
      }
      const base = current.slice(0, -(oldTok.length + 1))
      const updated = value ? `${base}-${value}` : base
      nextNames.set(key, updated)
      changed = true
    }
    if (changed) {
      onChange(nextNames)
    }
  }, [files, names, onChange, onPageTokensChange, pageTokens])

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="sm"
      fullWidth
      aria-labelledby="ad-names-title"
      classes={{ paper: styles.paper }}
    >
      <Box component="header" className={styles.header}>
        <Box className={styles.headerTitleWrap}>
          <DriveFileRenameOutlineIcon className={styles.headerIcon} fontSize="inherit" />
          <Typography id="ad-names-title" component="h2" variant="inherit" className={styles.headerTitle}>
            Name each ad
          </Typography>
          <Typography component="span" variant="inherit" className={styles.headerCount}>
            {files.length} {files.length === 1 ? 'creative' : 'creatives'}
            {' · '}
            {adsCount} {adsCount === 1 ? 'ad' : 'ads'}
          </Typography>
        </Box>
        <IconButton aria-label="Close" onClick={onClose} className={styles.closeButton}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Box className={styles.body}>
        <Box className={styles.bulk}>
          <Box
            component="button"
            type="button"
            className={styles.bulkToggle}
            onClick={toggleBulk}
            aria-expanded={bulkOpen}
          >
            <LocalOfferOutlinedIcon className={styles.bulkIcon} fontSize="inherit" />
            <Typography component="span" variant="inherit" className={styles.bulkTitle}>
              Bulk tags
            </Typography>
            <ExpandMoreIcon className={styles.chevron} data-open={bulkOpen ? 'true' : 'false'} fontSize="inherit" />
          </Box>
          <Collapse in={bulkOpen} timeout={180} unmountOnExit>
            <Box className={styles.bulkFields}>
              <TextField
                label="Product"
                size="small"
                variant="outlined"
                className={`density-form ${styles.tagField}`}
                value={tags.product}
                onChange={(e) => setTags({ ...tags, product: e.target.value })}
              />
              <TextField
                label="Creative info"
                size="small"
                variant="outlined"
                className={`density-form ${styles.tagField}`}
                value={tags.creativeInfo}
                onChange={(e) => setTags({ ...tags, creativeInfo: e.target.value })}
              />
              <TextField
                label="Text type"
                size="small"
                variant="outlined"
                className={`density-form ${styles.tagField}`}
                value={tags.textType}
                onChange={(e) => setTags({ ...tags, textType: e.target.value })}
              />
              <Button
                type="button"
                size="small"
                variant="text"
                className={styles.applyButton}
                onClick={handleApplyTags}
                disabled={tagsEmpty}
              >
                Apply to all
              </Button>
            </Box>

            <Box className={styles.bulkDivider} aria-hidden>
              <Typography component="span" variant="inherit" className={styles.bulkOr}>or</Typography>
            </Box>

            <Box className={`${styles.bulkFields} ${styles.bulkFieldsLast}`}>
              <TextField
                label="Full name for all ads"
                size="small"
                variant="outlined"
                className={`density-form ${styles.fullNameField}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Button
                type="button"
                size="small"
                variant="text"
                className={styles.applyButton}
                onClick={handleApplyFullName}
                disabled={fullName.trim() === ''}
              >
                Apply to all
              </Button>
            </Box>
          </Collapse>
        </Box>

        <Box className={styles.bulk}>
          <Box
            component="button"
            type="button"
            className={styles.bulkToggle}
            onClick={togglePageNames}
            aria-expanded={pageNamesOpen}
          >
            <LabelOutlinedIcon className={styles.bulkIcon} fontSize="inherit" />
            <Typography component="span" variant="inherit" className={styles.bulkTitle}>
              Page names — appended to every name
            </Typography>
            <ExpandMoreIcon className={styles.chevron} data-open={pageNamesOpen ? 'true' : 'false'} fontSize="inherit" />
          </Box>
          <Collapse in={pageNamesOpen} timeout={180} unmountOnExit>
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
                  <TextField
                    size="small"
                    variant="outlined"
                    className={`density-form ${styles.pageTokenField}`}
                    placeholder={pageToken(page.name)}
                    value={pageTokens.has(page.id) ? (pageTokens.get(page.id) ?? '') : pageToken(page.name)}
                    onChange={(e) => setPageTok(page, e.target.value)}
                  />
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>

        <Box className={styles.listHeader}>
          <Typography component="span" variant="inherit" className={styles.listHeaderLabel}>
            Ad names
          </Typography>
          <Typography component="span" variant="inherit" className={styles.listHeaderCount}>
            {adsCount}
          </Typography>
        </Box>

        <Box className={styles.list}>
          {selectedPages.flatMap((page) => files.map((file, fileIndex) => {
            const key = adNameMapKey(page.id, file)
            const fallback = buildAutoAdName(file, resolveTok(page))
            const MediaIcon = mediaToken(file) === 'Video' ? MovieOutlinedIcon : ImageOutlinedIcon
            return (
              <Box key={`${page.id}-${fileIndex}`} className={styles.fileRow}>
                <Box className={styles.fileHead}>
                  <Box component="span" className={styles.mediaIcon} aria-hidden>
                    <MediaIcon fontSize="inherit" />
                  </Box>
                  <Typography component="span" variant="inherit" className={styles.fileName}>
                    {file.name}
                  </Typography>
                  {multiPage && (
                    <Typography component="span" variant="inherit" className={styles.pageChip}>
                      {page.name}
                    </Typography>
                  )}
                </Box>
                <TextField
                  size="small"
                  variant="outlined"
                  fullWidth
                  className="density-form"
                  value={names.get(key) ?? fallback}
                  onChange={(e) => setName(key, e.target.value, fallback)}
                />
              </Box>
            )
          }))}
        </Box>
      </Box>

      <Box className={styles.footer}>
        <Button
          type="button"
          variant="contained"
          disableElevation
          className={styles.saveButton}
          onClick={onClose}
        >
          Save
        </Button>
      </Box>
    </Dialog>
  )
})
