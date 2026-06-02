'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import CloseIcon from '@mui/icons-material/Close'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import {
  type AdNameTags,
  EMPTY_AD_NAME_TAGS,
  adCombos,
  adNameMapKey,
  buildAdNameFromTags,
  mapWith,
  resolvePageToken,
  restampPageToken,
} from '../helpers'
import BulkNamingSection from './BulkNamingSection/BulkNamingSection'
import PageTokensSection from './PageTokensSection/PageTokensSection'
import AdNamesList from './AdNamesList/AdNamesList'
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
  const adsCount = files.length * Math.max(selectedPages.length, 1)

  const [bulkOpen, setBulkOpen] = useState(false)
  const toggleBulk = useCallback(() => setBulkOpen((v) => !v), [])
  const [pageNamesOpen, setPageNamesOpen] = useState(false)
  const togglePageNames = useCallback(() => setPageNamesOpen((v) => !v), [])
  const [tags, setTags] = useState<AdNameTags>(EMPTY_AD_NAME_TAGS)
  const tagsEmpty = tags.product === '' && tags.creativeInfo === ''
    && tags.textType === '' && tags.destination === ''
  const [fullName, setFullName] = useState('')

  const combos = useMemo(
    () => adCombos(selectedPages, files, pageTokens),
    [selectedPages, files, pageTokens],
  )

  const handleApplyTags = useCallback(() => {
    onChange(new Map(combos.map((c) => [c.key, buildAdNameFromTags(c.file, c.pageTok, tags)])))
  }, [combos, onChange, tags])

  // Apply one full name to every ad; the page token is always appended last.
  const handleApplyFullName = useCallback(() => {
    const trimmed = fullName.trim()
    if (trimmed === '') {
      return
    }
    onChange(new Map(combos.map((c) => [c.key, c.pageTok ? `${trimmed}-${c.pageTok}` : trimmed])))
  }, [combos, fullName, onChange])

  const setName = useCallback((key: string, value: string, fallback: string) => {
    onChange(mapWith(names, key, value === '' || value === fallback ? null : value))
  }, [names, onChange])

  // Store the raw value (including empty) once touched, so the field is freely
  // editable — page naming is optional, an empty token just omits it. Also
  // re-stamp the token on already-set ad names for this page so the change
  // applies live (only on names that still carry the old token — manual edits
  // are left alone).
  const setPageTok = useCallback((page: Page, value: string) => {
    const oldTok = resolvePageToken(pageTokens, page.id, page.name)
    onPageTokensChange(mapWith(pageTokens, page.id, value))

    if (oldTok === value) {
      return
    }
    let changed = false
    const nextNames = new Map(names)
    for (const file of files) {
      const key = adNameMapKey(page.id, file)
      const current = names.get(key)
      if (current === undefined) {
        continue
      }
      const updated = restampPageToken(current, oldTok, value)
      if (updated !== current) {
        nextNames.set(key, updated)
        changed = true
      }
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
      maxWidth="md"
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
        <BulkNamingSection
          open={bulkOpen}
          onToggle={toggleBulk}
          tags={tags}
          onTagsChange={setTags}
          onApplyTags={handleApplyTags}
          tagsEmpty={tagsEmpty}
          fullName={fullName}
          onFullNameChange={setFullName}
          onApplyFullName={handleApplyFullName}
        />

        <PageTokensSection
          open={pageNamesOpen}
          onToggle={togglePageNames}
          selectedPages={selectedPages}
          pageTokens={pageTokens}
          onPageTokChange={setPageTok}
        />

        <AdNamesList
          combos={combos}
          adsCount={adsCount}
          names={names}
          multiPage={multiPage}
          onNameChange={setName}
        />
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
