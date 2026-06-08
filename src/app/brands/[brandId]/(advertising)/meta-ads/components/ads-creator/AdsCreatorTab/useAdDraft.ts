'use client'

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { EMPTY_COPY, type CopyValue } from './CopyForm/CopyForm'
import { type AssetCreative } from './assetCreative'
import { incompatibleAssetKeys } from './assetCompat'
import {
  countEmptyRequired,
  creativeKey,
  type CopyOverride,
  type EmptyRequiredCounts,
} from './perCreativeCopy'
import { EMPTY_TARGETING, type TargetingValue } from './CreatorPane/useTargetingData'
import { adNameMapKey, canSubmitCreator } from './CreatorPane/helpers'

export interface AdDraft {
  readonly files: readonly File[]
  readonly setFiles: Dispatch<SetStateAction<readonly File[]>>
  readonly assets: readonly AssetCreative[]
  readonly setAssets: Dispatch<SetStateAction<readonly AssetCreative[]>>
  readonly targeting: TargetingValue
  readonly setTargeting: Dispatch<SetStateAction<TargetingValue>>
  readonly copy: CopyValue
  readonly setCopy: Dispatch<SetStateAction<CopyValue>>
  readonly adNames: ReadonlyMap<string, string>
  readonly setAdNames: Dispatch<SetStateAction<ReadonlyMap<string, string>>>
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
  readonly setCopyOverrides: Dispatch<SetStateAction<ReadonlyMap<string, CopyOverride>>>
  readonly pageTokens: ReadonlyMap<string, string>
  readonly setPageTokens: Dispatch<SetStateAction<ReadonlyMap<string, string>>>
  readonly creativeCount: number
  readonly emptyRequired: EmptyRequiredCounts
  readonly addedAssetKeys: ReadonlySet<string>
  readonly canSubmit: boolean
  readonly isDirty: boolean
  readonly resetDraft: () => void
  readonly clearForNextBatch: () => void
}

// Owns the whole ad draft: the seven pieces of state, the effects that prune stale
// map entries when creatives/pages change, the derived validation (empty required
// copy, cross-BM blocks, can-submit, is-dirty), and the two clear operations
// (full reset vs. clear-after-launch). The container just composes it.
export function useAdDraft(): AdDraft {
  const [files, setFiles] = useState<readonly File[]>([])
  const [assets, setAssets] = useState<readonly AssetCreative[]>([])
  const [targeting, setTargeting] = useState<TargetingValue>(EMPTY_TARGETING)
  const [copy, setCopy] = useState<CopyValue>(EMPTY_COPY)
  const [adNames, setAdNames] = useState<ReadonlyMap<string, string>>(() => new Map())
  const [copyOverrides, setCopyOverrides] = useState<ReadonlyMap<string, CopyOverride>>(() => new Map())
  const [pageTokens, setPageTokens] = useState<ReadonlyMap<string, string>>(() => new Map())

  // Drop custom page tokens for pages no longer selected.
  useEffect(() => {
    setPageTokens((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set(targeting.pageIds)
      const next = new Map<string, string>()
      for (const [key, value] of prev) {
        if (valid.has(key)) {
          next.set(key, value)
        }
      }
      return next.size === prev.size ? prev : next
    })
  }, [targeting.pageIds])

  // Keep per-ad naming in sync with the current pages × files — drop entries for
  // ads no longer present (file removed or page deselected) so stale names never
  // leak into a later submit.
  useEffect(() => {
    setAdNames((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set<string>()
      for (const pageId of targeting.pageIds) {
        for (const file of files) {
          valid.add(adNameMapKey(pageId, creativeKey(file)))
        }
        for (const asset of assets) {
          valid.add(adNameMapKey(pageId, asset.assetKey))
        }
      }
      const next = new Map<string, string>()
      for (const [key, value] of prev) {
        if (valid.has(key)) {
          next.set(key, value)
        }
      }
      return next.size === prev.size ? prev : next
    })
  }, [files, assets, targeting.pageIds])

  // Drop per-creative copy overrides for creatives no longer present, so a
  // removed file/asset can't leak its copy into a later submit.
  useEffect(() => {
    setCopyOverrides((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set<string>()
      for (const file of files) {
        valid.add(creativeKey(file))
      }
      for (const asset of assets) {
        valid.add(asset.assetKey)
      }
      const next = new Map<string, CopyOverride>()
      for (const [key, value] of prev) {
        if (valid.has(key)) {
          next.set(key, value)
        }
      }
      return next.size === prev.size ? prev : next
    })
  }, [files, assets])

  const creativeCount = files.length + assets.length
  const creativeKeys = useMemo(
    () => [...files.map((f) => creativeKey(f)), ...assets.map((a) => a.assetKey)],
    [files, assets],
  )
  // Validate the copy each ad would actually publish (its own override, else the
  // shared base) — not just the shared field. This blocks ads that would go out with
  // an empty primary text / headline, and stops falsely blocking when every creative
  // overrides an (empty) shared field.
  const emptyRequired = useMemo(
    () => countEmptyRequired(copy, copyOverrides, creativeKeys),
    [copy, copyOverrides, creativeKeys],
  )
  // Library assets that can't publish to the selected account (cross-BM videos)
  // block Publish until removed — mirrors the inline error and the Files step.
  const invalidAssetKeys = useMemo(
    () => incompatibleAssetKeys(assets, targeting.accountId),
    [assets, targeting.accountId],
  )
  const addedAssetKeys = useMemo(() => new Set(assets.map((a) => a.assetKey)), [assets])

  const canSubmit = canSubmitCreator(targeting, copy, creativeCount)
    && emptyRequired.primary === 0
    && emptyRequired.headline === 0
    && emptyRequired.url === 0
    && invalidAssetKeys.size === 0

  // Whether the draft holds anything worth clearing — drives the header Reset button's
  // disabled state so it never tempts a click on an already-empty draft.
  const isDirty = useMemo(() => (
    files.length > 0
    || assets.length > 0
    || adNames.size > 0
    || copyOverrides.size > 0
    || pageTokens.size > 0
    || targeting.accountId !== ''
    || targeting.campaignId !== ''
    || targeting.adSetId !== ''
    || targeting.pageIds.length > 0
    || targeting.instagramId !== ''
    || copy.name !== ''
    || copy.url !== ''
    || copy.description !== ''
    || copy.cta !== EMPTY_COPY.cta
    || copy.activate !== EMPTY_COPY.activate
    || copy.primaryTexts.some((t) => t.trim() !== '')
    || copy.headlines.some((t) => t.trim() !== '')
  ), [files, assets, adNames, copyOverrides, pageTokens, targeting, copy])

  // Reset the whole draft back to a blank slate. The launch queue is intentionally
  // left untouched — those are ads already on their way, not part of this draft.
  const resetDraft = useCallback(() => {
    setFiles([])
    setAssets([])
    setTargeting(EMPTY_TARGETING)
    setCopy(EMPTY_COPY)
    setAdNames(new Map())
    setCopyOverrides(new Map())
    setPageTokens(new Map())
  }, [])

  // After a successful launch: clear what was just sent (creatives + per-ad names +
  // page tokens) but keep targeting and shared copy so the next batch can reuse them.
  const clearForNextBatch = useCallback(() => {
    setFiles([])
    setAssets([])
    setAdNames(new Map())
    setPageTokens(new Map())
  }, [])

  return {
    files,
    setFiles,
    assets,
    setAssets,
    targeting,
    setTargeting,
    copy,
    setCopy,
    adNames,
    setAdNames,
    copyOverrides,
    setCopyOverrides,
    pageTokens,
    setPageTokens,
    creativeCount,
    emptyRequired,
    addedAssetKeys,
    canSubmit,
    isDirty,
    resetDraft,
    clearForNextBatch,
  }
}
