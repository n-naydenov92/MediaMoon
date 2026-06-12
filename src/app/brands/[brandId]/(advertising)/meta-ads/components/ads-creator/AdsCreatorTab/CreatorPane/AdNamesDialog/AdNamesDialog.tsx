'use client'

import { memo, useCallback, useDeferredValue, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import {
  type AdNameTags,
  type NameableCreative,
  EMPTY_AD_NAME_TAGS,
  adCombos,
  buildAdNameFromTags,
  mapWith,
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
  const adsCount = creatives.length * selectedPages.length

  const [bulkOpen, setBulkOpen] = useState(true)
  const toggleBulk = useCallback(() => setBulkOpen((v) => !v), [])
  const [pageNamesOpen, setPageNamesOpen] = useState(true)
  const togglePageNames = useCallback(() => setPageNamesOpen((v) => !v), [])
  const [tags, setTags] = useState<AdNameTags>(EMPTY_AD_NAME_TAGS)
  const [fullName, setFullName] = useState('')

  const combos = useMemo(
    () => adCombos(selectedPages, creatives, pageTokens),
    [selectedPages, creatives, pageTokens],
  )

  // Live bulk typing rewrites the whole names map each keystroke. The ad-name list
  // is the heavy consumer, so it reads a deferred copy — keeping the bulk/page fields
  // responsive while the rows catch up off the keystroke critical path.
  const deferredNames = useDeferredValue(names)

  // setName reads the latest names through a ref so its identity stays stable —
  // memoized rows only re-render the field actually being edited.
  const namesRef = useRef(names)
  namesRef.current = names

  // Live: any bulk field or page name rewrites every ad name as you type. Full name
  // wins when present, else the structured tags; clearing the template falls back to
  // the auto names. A page token is appended only when the operator has typed one.
  const rebuildNames = useCallback((
    nextTags: AdNameTags,
    nextFullName: string,
    nextTokens: ReadonlyMap<string, string>,
  ) => {
    const trimmed = nextFullName.trim()
    const hasTags = nextTags.product !== '' || nextTags.creativeInfo !== ''
      || nextTags.textType !== '' || nextTags.destination !== ''
    if (trimmed === '' && !hasTags) {
      onChange(new Map())
      return
    }
    const next = adCombos(selectedPages, creatives, nextTokens).map((c): [string, string] => {
      if (trimmed !== '') {
        return [c.key, c.pageTok ? `${trimmed}-${c.pageTok}` : trimmed]
      }
      return [c.key, buildAdNameFromTags(c.creative, c.pageTok, nextTags)]
    })
    onChange(new Map(next))
  }, [selectedPages, creatives, onChange])

  const handleTagsChange = useCallback((next: AdNameTags) => {
    setTags(next)
    rebuildNames(next, fullName, pageTokens)
  }, [rebuildNames, fullName, pageTokens])

  const handleFullNameChange = useCallback((next: string) => {
    setFullName(next)
    rebuildNames(tags, next, pageTokens)
  }, [rebuildNames, tags, pageTokens])

  const setName = useCallback((key: string, value: string, fallback: string) => {
    onChange(mapWith(namesRef.current, key, value === '' || value === fallback ? null : value))
  }, [onChange])

  // Page name is optional — an empty field appends no token. Typing one rewrites the
  // generated names live.
  const setPageTok = useCallback((page: Page, value: string) => {
    const nextTokens = mapWith(pageTokens, page.id, value)
    onPageTokensChange(nextTokens)
    rebuildNames(tags, fullName, nextTokens)
  }, [pageTokens, onPageTokensChange, rebuildNames, tags, fullName])

  const countLabel = `${creatives.length} ${creatives.length === 1 ? 'creative' : 'creatives'}`
    + ` · ${adsCount} ${adsCount === 1 ? 'ad' : 'ads'}`

  // The actionable hint lives in the Page names section ("Select a page…"), so the
  // empty output area just labels itself rather than repeating the call to action.
  const emptyHint = 'Your ad names will appear here'

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
          onTagsChange={handleTagsChange}
          fullName={fullName}
          onFullNameChange={handleFullNameChange}
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
          names={deferredNames}
          multiPage={multiPage}
          emptyHint={emptyHint}
          onNameChange={setName}
        />
      </Box>
    </CreatorDialog>
  )
})
