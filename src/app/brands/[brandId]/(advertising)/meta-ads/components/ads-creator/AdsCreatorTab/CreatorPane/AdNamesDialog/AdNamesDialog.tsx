'use client'

import { memo, useCallback, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import {
  type AdNameTags,
  type NameableCreative,
  EMPTY_AD_NAME_TAGS,
  adCombos,
  adNameMapKey,
  buildAdNameFromTags,
  mapWith,
  resolvePageToken,
  restampPageToken,
} from '../helpers'
import CreatorDialog from '../../CreatorDialog/CreatorDialog'
import BulkNamingSection from './BulkNamingSection/BulkNamingSection'
import PageTokensSection from './PageTokensSection/PageTokensSection'
import AdNamesList from './AdNamesList/AdNamesList'
import styles from './AdNamesDialog.module.css'

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly creatives: readonly NameableCreative[]
  readonly selectedPages: readonly Page[]
  readonly names: ReadonlyMap<string, string>
  readonly onChange: (next: ReadonlyMap<string, string>) => void
  readonly pageTokens: ReadonlyMap<string, string>
  readonly onPageTokensChange: (next: ReadonlyMap<string, string>) => void
}

export default memo(function AdNamesDialog({
  open,
  onClose,
  creatives,
  selectedPages,
  names,
  onChange,
  pageTokens,
  onPageTokensChange,
}: Props): JSX.Element {
  const multiPage = selectedPages.length > 1
  const adsCount = creatives.length * Math.max(selectedPages.length, 1)

  const [bulkOpen, setBulkOpen] = useState(false)
  const toggleBulk = useCallback(() => setBulkOpen((v) => !v), [])
  const [pageNamesOpen, setPageNamesOpen] = useState(false)
  const togglePageNames = useCallback(() => setPageNamesOpen((v) => !v), [])
  const [tags, setTags] = useState<AdNameTags>(EMPTY_AD_NAME_TAGS)
  const tagsEmpty = tags.product === '' && tags.creativeInfo === ''
    && tags.textType === '' && tags.destination === ''
  const [fullName, setFullName] = useState('')

  const combos = useMemo(
    () => adCombos(selectedPages, creatives, pageTokens),
    [selectedPages, creatives, pageTokens],
  )

  // The name and token maps change on every keystroke. Reading them through a ref
  // keeps `setName`/`setPageTok` stable, so the memoized rows below only re-render
  // the field actually being edited instead of the whole list each keystroke.
  const liveRef = useRef({ names, pageTokens })
  liveRef.current = { names, pageTokens }

  const handleApplyTags = useCallback(() => {
    onChange(new Map(combos.map((c) => [c.key, buildAdNameFromTags(c.creative, c.pageTok, tags)])))
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
    onChange(mapWith(liveRef.current.names, key, value === '' || value === fallback ? null : value))
  }, [onChange])

  // Store the raw value (including empty) once touched, so the field is freely
  // editable — page naming is optional, an empty token just omits it. Also
  // re-stamp the token on already-set ad names for this page so the change
  // applies live (only on names that still carry the old token — manual edits
  // are left alone).
  const setPageTok = useCallback((page: Page, value: string) => {
    const { names: currNames, pageTokens: currTokens } = liveRef.current
    const oldTok = resolvePageToken(currTokens, page.id, page.name)
    onPageTokensChange(mapWith(currTokens, page.id, value))

    if (oldTok === value) {
      return
    }
    let changed = false
    const nextNames = new Map(currNames)
    for (const creative of creatives) {
      const key = adNameMapKey(page.id, creative.key)
      const current = currNames.get(key)
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
  }, [creatives, onChange, onPageTokensChange])

  const countLabel = `${creatives.length} ${creatives.length === 1 ? 'creative' : 'creatives'}`
    + ` · ${adsCount} ${adsCount === 1 ? 'ad' : 'ads'}`

  return (
    <CreatorDialog
      open={open}
      onClose={onClose}
      icon={<DriveFileRenameOutlineIcon fontSize="inherit" />}
      title="Name each ad"
      titleId="ad-names-title"
      count={countLabel}
      maxWidth="md"
      paperClassName={styles.paper}
      footer={(
        <Button
          type="button"
          variant="contained"
          disableElevation
          className={styles.saveButton}
          onClick={onClose}
        >
          Save
        </Button>
      )}
    >
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
    </CreatorDialog>
  )
})
