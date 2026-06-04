'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Popover from '@mui/material/Popover'
import Typography from '@mui/material/Typography'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import type { BrandId } from '@/config/brands'
import type { MarketSelection } from '@/lib/markets'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import type { CopyValue } from '../../CopyForm/CopyForm'
import { addTextVariation } from '../../CopyForm/VariationList/helpers'
import {
  resolveCopy,
  withOverrideField,
  type CopyOverride,
  type OverridableField,
} from '../../perCreativeCopy'
import type { AssetCreative } from '../../assetCreative'
import AdFeedCard from '../../AdFeedCard/AdFeedCard'
import LibraryPane from '../../LibraryPane/LibraryPane'
import CreatorDialog from '../../CreatorDialog/CreatorDialog'
import { mapWith } from '../helpers'
import CreativeRail from './CreativeRail/CreativeRail'
import CopyDetail from './CopyDetail/CopyDetail'
import { applyOverrideToKeys, assetItem, fileItem, type CreativeItem } from './helpers'
import styles from './CopyEachDialog.module.css'

// Below this width the 3-pane workspace can't breathe, so the dialog goes
// full-screen (md breakpoint).
const FULLSCREEN_BELOW = 900

interface Props {
  readonly open: boolean
  readonly onClose: () => void
  readonly brandId: BrandId
  readonly market: MarketSelection
  readonly files: readonly File[]
  readonly assets: readonly AssetCreative[]
  readonly baseCopy: CopyValue
  readonly overrides: ReadonlyMap<string, CopyOverride>
  readonly onOverridesChange: (next: ReadonlyMap<string, CopyOverride>) => void
  readonly selectedPages: readonly Page[]
  readonly addedAssetKeys: ReadonlySet<string>
  readonly onAddCreative: (asset: AssetCreative) => void
}

export default memo(function CopyEachDialog({
  open,
  onClose,
  brandId,
  market,
  files,
  assets,
  baseCopy,
  overrides,
  onOverridesChange,
  selectedPages,
  addedAssetKeys,
  onAddCreative,
}: Props): JSX.Element {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [checkedKeys, setCheckedKeys] = useState<ReadonlySet<string>>(() => new Set())
  const [importAnchor, setImportAnchor] = useState<HTMLElement | null>(null)

  const fileUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => {
    for (const url of fileUrls) {
      URL.revokeObjectURL(url)
    }
  }, [fileUrls])

  const items = useMemo<readonly CreativeItem[]>(
    () => [...files.map((file, i) => fileItem(file, fileUrls[i]!)), ...assets.map(assetItem)],
    [files, fileUrls, assets],
  )

  // Derive the active creative from the user's selection, falling back to the
  // first whenever the selection is empty or no longer present — no effect, no
  // second source of truth.
  const activeKey = selectedKey && items.some((i) => i.key === selectedKey)
    ? selectedKey
    : (items[0]?.key ?? null)

  const activeOverride = activeKey ? overrides.get(activeKey) : undefined
  const activeValue = activeKey ? resolveCopy(baseCopy, activeOverride) : null
  const activeItem = items.find((i) => i.key === activeKey) ?? null

  const updateField = useCallback(
    <F extends OverridableField>(field: F, next: CopyValue[F]): void => {
      if (!activeKey) {
        return
      }
      const nextOverride = withOverrideField(baseCopy, overrides.get(activeKey), field, next)
      onOverridesChange(mapWith(overrides, activeKey, nextOverride))
    },
    [activeKey, baseCopy, overrides, onOverridesChange],
  )

  const toggleCheck = useCallback((key: string): void => {
    setCheckedKeys((curr) => {
      const next = new Set(curr)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const applyToChecked = useCallback((): void => {
    if (!activeKey) {
      return
    }
    onOverridesChange(applyOverrideToKeys(overrides, overrides.get(activeKey), [...checkedKeys]))
  }, [activeKey, checkedKeys, overrides, onOverridesChange])

  const resetActive = useCallback((): void => {
    if (!activeKey) {
      return
    }
    onOverridesChange(mapWith(overrides, activeKey, null))
  }, [activeKey, overrides, onOverridesChange])

  const addPrimaryToActive = useCallback((value: string): void => {
    if (!activeValue) {
      return
    }
    updateField('primaryTexts', addTextVariation(activeValue.primaryTexts, value))
  }, [activeValue, updateField])

  const addHeadlineToActive = useCallback((value: string): void => {
    if (!activeValue) {
      return
    }
    updateField('headlines', addTextVariation(activeValue.headlines, value))
  }, [activeValue, updateField])

  const addUrlToActive = useCallback((value: string): void => {
    updateField('url', value)
  }, [updateField])

  const page = selectedPages[0] ?? null

  return (
    <CreatorDialog
      open={open}
      onClose={onClose}
      icon={<EditNoteOutlinedIcon fontSize="inherit" />}
      title="Edit copy per creative"
      titleId="copy-each-title"
      count={`${items.length} ${items.length === 1 ? 'creative' : 'creatives'}`}
      maxWidth="xl"
      fullScreenBelow={FULLSCREEN_BELOW}
      paperClassName={styles.paper}
      footer={(
        <Button type="button" variant="contained" disableElevation onClick={onClose} className={styles.doneButton}>
          Done
        </Button>
      )}
    >
      <Box className={styles.body}>
        <CreativeRail
          items={items}
          base={baseCopy}
          overrides={overrides}
          activeKey={activeKey}
          checkedKeys={checkedKeys}
          onSelect={setSelectedKey}
          onToggleCheck={toggleCheck}
          onApplyToChecked={applyToChecked}
          onResetActive={resetActive}
        />

        <Box className={styles.detailCol}>
          <CopyDetail
            value={activeValue}
            onFieldChange={updateField}
            onImport={setImportAnchor}
          />
        </Box>

        <Box className={styles.previewCol}>
          {activeValue ? (
            <AdFeedCard
              pageName={page?.name ?? 'Your page'}
              pageAvatar={page?.pictureUrl ?? null}
              primary={activeValue.primaryTexts[0] ?? ''}
              headline={activeValue.headlines[0] ?? ''}
              description={activeValue.description}
              url={activeValue.url}
              cta={activeValue.cta}
              media={activeItem?.media ?? null}
            />
          ) : (
            <Typography component="span" variant="inherit" className={styles.previewEmpty}>
              No creative selected.
            </Typography>
          )}
        </Box>
      </Box>

      <Popover
        open={Boolean(importAnchor)}
        anchorEl={importAnchor}
        onClose={() => setImportAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        classes={{ paper: styles.importPaper }}
      >
        <Box className={styles.importPanel}>
          <LibraryPane
            brandId={brandId}
            market={market}
            primaryTexts={activeValue?.primaryTexts ?? baseCopy.primaryTexts}
            headlines={activeValue?.headlines ?? baseCopy.headlines}
            url={activeValue?.url ?? baseCopy.url}
            addedAssetKeys={addedAssetKeys}
            onAddPrimaryText={addPrimaryToActive}
            onAddHeadline={addHeadlineToActive}
            onAddUrl={addUrlToActive}
            onAddCreative={onAddCreative}
          />
        </Box>
      </Popover>
    </CreatorDialog>
  )
})
