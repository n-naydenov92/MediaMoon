'use client'

import { memo, useCallback, useDeferredValue, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DriveFileRenameOutlineIcon from '@mui/icons-material/DriveFileRenameOutline'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import {
  adCombos,
  hasNamingInput,
  type AdNaming,
  type NameableCreative,
} from '../../adNaming'
import type { AdNamingActions } from '../../useAdNaming'
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
  readonly naming: AdNaming
  readonly actions: AdNamingActions
}

export default memo(function AdNamesDialog({
  open,
  onClose,
  creatives,
  selectedPages,
  naming,
  actions,
}: Props): JSX.Element {
  const [bulkOpen, setBulkOpen] = useState(true)
  const [pageNamesOpen, setPageNamesOpen] = useState(true)

  // A template or page-name keystroke renames every row, so the list reads those
  // deferred and the fields above stay instant. Hand-typed names stay live: the row
  // being typed in must render its own keystroke in the same pass, or React resets
  // the input to the stale value and the caret jumps to the end.
  const deferredTemplate = useDeferredValue(naming.template)
  const deferredPageTokens = useDeferredValue(naming.pageTokens)
  const combos = useMemo(
    () => adCombos(selectedPages, creatives, deferredPageTokens),
    [selectedPages, creatives, deferredPageTokens],
  )

  const toggleBulk = useCallback(() => setBulkOpen((v) => !v), [])
  const togglePageNames = useCallback(() => setPageNamesOpen((v) => !v), [])

  const multiPage = selectedPages.length > 1
  const adsCount = creatives.length * selectedPages.length
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
        <>
          <Button
            type="button"
            variant="text"
            color="inherit"
            disabled={!hasNamingInput(naming)}
            className={styles.clearButton}
            onClick={actions.clear}
          >
            Clear all
          </Button>
          <Button
            type="button"
            variant="contained"
            disableElevation
            className={styles.saveButton}
            onClick={onClose}
          >
            Save
          </Button>
        </>
      )}
    >
      <Box className={styles.body}>
        <BulkNamingSection
          open={bulkOpen}
          onToggle={toggleBulk}
          template={naming.template}
          onModeChange={actions.setMode}
          onTagChange={actions.setTag}
          onCustomNameChange={actions.setCustomName}
        />

        <PageTokensSection
          open={pageNamesOpen}
          onToggle={togglePageNames}
          selectedPages={selectedPages}
          pageTokens={naming.pageTokens}
          onPageTokenChange={actions.setPageToken}
        />

        <AdNamesList
          combos={combos}
          adsCount={adsCount}
          template={deferredTemplate}
          overrides={naming.overrides}
          multiPage={multiPage}
          emptyHint={emptyHint}
          actions={actions}
          onResetOverrides={actions.resetOverrides}
        />
      </Box>
    </CreatorDialog>
  )
})
