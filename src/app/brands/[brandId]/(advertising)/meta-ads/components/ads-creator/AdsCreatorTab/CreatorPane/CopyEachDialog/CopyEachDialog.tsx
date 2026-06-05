'use client'

import { memo, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import CollectionsBookmarkOutlinedIcon from '@mui/icons-material/CollectionsBookmarkOutlined'
import type { BrandId } from '@/config/brands'
import type { MarketSelection } from '@/lib/markets'
import type { Page } from '@/lib/gateways/MetaAdsGateway'
import type { CopyValue } from '../../CopyForm/CopyForm'
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
import DecisionDialog from '../../DecisionDialog/DecisionDialog'
import { useBaseFilled } from '../../useBaseFilled'
import { mapWith } from '../helpers'
import CreativeRail from './CreativeRail/CreativeRail'
import CopyDetail from './CopyDetail/CopyDetail'
import { applyOverrideToKeys, assetItem, fileItem, type CreativeItem } from './helpers'
import styles from './CopyEachDialog.module.css'

// Below this width the 3-pane workspace can't breathe, so the dialog goes
// full-screen (md breakpoint).
const FULLSCREEN_BELOW = 900

type RightTab = 'preview' | 'library'

const FIELD_LABEL: Record<'primaryTexts' | 'headlines' | 'url', string> = {
  primaryTexts: 'primary text',
  headlines: 'headline',
  url: 'destination URL',
}

function hasValue(value: CopyValue[OverridableField]): boolean {
  return Array.isArray(value)
    ? value.some((v) => v.trim() !== '')
    : String(value).trim() !== ''
}

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
  const [rightTab, setRightTab] = useState<RightTab>('preview')
  const [pending, setPending] = useState<{ message: string; commit: () => void } | null>(null)

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
  const baseFilled = useBaseFilled(baseCopy)

  // The rail badges and the library's "added" highlight track the overrides but
  // don't need to update on the same frame as the keystroke. Deferring them keeps
  // the edited field and live preview responsive while typing in the detail pane.
  const deferredOverrides = useDeferredValue(overrides)
  const deferredActiveValue = activeKey ? resolveCopy(baseCopy, deferredOverrides.get(activeKey)) : null

  // The active creative is always a target (it's the one on screen); checked
  // others extend the set. Library "Add" writes to all of them.
  const addTargets = useMemo(() => {
    if (!activeKey) {
      return [] as readonly string[]
    }
    return [activeKey, ...[...checkedKeys].filter((k) => k !== activeKey)]
  }, [activeKey, checkedKeys])

  // Edit context read through a ref so `updateField` keeps a stable identity. Its
  // inputs (`overrides`, `activeKey`, …) change on every keystroke; without the ref
  // the callback would be reborn each time, re-rendering the whole detail pane.
  const editRef = useRef({ activeKey, baseCopy, overrides, onOverridesChange })
  editRef.current = { activeKey, baseCopy, overrides, onOverridesChange }

  const updateField = useCallback(
    <F extends OverridableField>(field: F, next: CopyValue[F]): void => {
      const { activeKey: key, baseCopy: base, overrides: curr, onOverridesChange: change } = editRef.current
      if (!key) {
        return
      }
      const nextOverride = withOverrideField(base, curr.get(key), field, next)
      change(mapWith(curr, key, nextOverride))
    },
    [],
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
    const targets = [...checkedKeys].filter((k) => k !== activeKey)
    if (targets.length === 0) {
      return
    }
    onOverridesChange(applyOverrideToKeys(overrides, overrides.get(activeKey), targets))
  }, [activeKey, checkedKeys, overrides, onOverridesChange])

  const resetActive = useCallback((): void => {
    if (!activeKey) {
      return
    }
    onOverridesChange(mapWith(overrides, activeKey, null))
  }, [activeKey, overrides, onOverridesChange])

  // Apply a library value to every target. With >1 target that already carries a
  // value for the field, ask first so a bulk add can't silently wipe custom copy.
  const requestAddText = useCallback(
    <F extends OverridableField>(field: F, applied: CopyValue[F], label: string): void => {
      if (addTargets.length === 0) {
        return
      }
      const commit = (): void => {
        let next = overrides
        for (const key of addTargets) {
          next = mapWith(next, key, withOverrideField(baseCopy, next.get(key), field, applied))
        }
        onOverridesChange(next)
        setPending(null)
      }
      const replacing = addTargets.filter((key) => hasValue(resolveCopy(baseCopy, overrides.get(key))[field])).length
      if (addTargets.length > 1 && replacing > 0) {
        setPending({ message: `This replaces the ${label} on ${addTargets.length} creatives.`, commit })
      } else {
        commit()
      }
    },
    [addTargets, baseCopy, overrides, onOverridesChange],
  )

  const addPrimaryToTargets = useCallback((value: string): void => {
    requestAddText('primaryTexts', [value], FIELD_LABEL.primaryTexts)
  }, [requestAddText])

  const addHeadlineToTargets = useCallback((value: string): void => {
    requestAddText('headlines', [value], FIELD_LABEL.headlines)
  }, [requestAddText])

  const addUrlToTargets = useCallback((value: string): void => {
    requestAddText('url', value, FIELD_LABEL.url)
  }, [requestAddText])

  const page = selectedPages[0] ?? null

  return (
    <CreatorDialog
      open={open}
      onClose={onClose}
      icon={<EditNoteOutlinedIcon fontSize="inherit" />}
      title="Edit per creative"
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
          baseFilled={baseFilled}
          overrides={deferredOverrides}
          activeKey={activeKey}
          checkedKeys={checkedKeys}
          onSelect={setSelectedKey}
          onToggleCheck={toggleCheck}
          onApplyToChecked={applyToChecked}
        />

        <Box className={styles.detailCol}>
          <CopyDetail
            value={activeValue}
            creativeName={activeItem?.name ?? null}
            onFieldChange={updateField}
            onReset={resetActive}
            canReset={activeOverride !== undefined}
          />
        </Box>

        <Box className={styles.rightCol}>
          <Box className={styles.rightTabs} role="tablist" aria-label="Preview or library">
            <Button
              type="button"
              role="tab"
              aria-selected={rightTab === 'preview'}
              startIcon={<VisibilityOutlinedIcon fontSize="inherit" />}
              onClick={() => setRightTab('preview')}
              className={`${styles.rightTab} ${rightTab === 'preview' ? styles.rightTabActive : ''}`}
            >
              Preview
            </Button>
            <Button
              type="button"
              role="tab"
              aria-selected={rightTab === 'library'}
              startIcon={<CollectionsBookmarkOutlinedIcon fontSize="inherit" />}
              onClick={() => setRightTab('library')}
              className={`${styles.rightTab} ${rightTab === 'library' ? styles.rightTabActive : ''}`}
            >
              Ad Library
            </Button>
          </Box>

          <Box className={rightTab === 'preview' ? styles.panel : styles.panelHidden}>
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

          <Box className={rightTab === 'library' ? styles.libraryPanel : styles.panelHidden}>
            <LibraryPane
              brandId={brandId}
              market={market}
              primaryTexts={deferredActiveValue?.primaryTexts ?? baseCopy.primaryTexts}
              headlines={deferredActiveValue?.headlines ?? baseCopy.headlines}
              url={deferredActiveValue?.url ?? baseCopy.url}
              addedAssetKeys={addedAssetKeys}
              onAddPrimaryText={addPrimaryToTargets}
              onAddHeadline={addHeadlineToTargets}
              onAddUrl={addUrlToTargets}
              onAddCreative={onAddCreative}
            />
          </Box>
        </Box>
      </Box>

      <DecisionDialog
        open={pending !== null}
        title="Replace copy on multiple creatives?"
        message={pending?.message ?? ''}
        onClose={() => setPending(null)}
        actions={[
          { label: 'Cancel', onClick: () => setPending(null) },
          { label: 'Replace', onClick: () => pending?.commit(), emphasis: true },
        ]}
      />
    </CreatorDialog>
  )
})
