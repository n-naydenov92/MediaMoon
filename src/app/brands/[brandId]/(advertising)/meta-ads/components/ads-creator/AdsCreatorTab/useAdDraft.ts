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
  type CopyOverride,
  type EmptyRequiredCounts,
} from './perCreativeCopy'
import {
  buildCreativeSlots,
  liveSourceKeys,
  makeDuplicate,
  type CreativeDuplicate,
  type CreativeSlot,
} from './creativeSlots'
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
  // Every ad slot in order — originals plus duplicates. Naming, validation and
  // publish all key off this, so one file can become several ads with their own copy.
  readonly slots: readonly CreativeSlot[]
  readonly duplicateCreative: (sourceKey: string) => void
  readonly removeDuplicate: (key: string) => void
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
  const [duplicates, setDuplicates] = useState<readonly CreativeDuplicate[]>([])

  // Originals + duplicates, in display order — the single source of truth for "how
  // many ads, keyed how" across naming, validation and publish.
  const slots = useMemo(
    () => buildCreativeSlots(files, assets, duplicates),
    [files, assets, duplicates],
  )

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

  // Drop duplicates whose source file/asset was removed, so an orphan slot can't
  // linger with copy that would never publish.
  useEffect(() => {
    setDuplicates((prev) => {
      if (prev.length === 0) {
        return prev
      }
      const live = liveSourceKeys(files, assets)
      const next = prev.filter((d) => live.has(d.sourceKey))
      return next.length === prev.length ? prev : next
    })
  }, [files, assets])

  // Keep per-ad naming in sync with the current pages × slots — drop entries for
  // ads no longer present (creative removed or page deselected) so stale names never
  // leak into a later submit.
  useEffect(() => {
    setAdNames((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set<string>()
      for (const pageId of targeting.pageIds) {
        for (const slot of slots) {
          valid.add(adNameMapKey(pageId, slot.key))
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
  }, [slots, targeting.pageIds])

  // Drop per-creative copy overrides for slots no longer present, so a removed
  // creative (or duplicate) can't leak its copy into a later submit.
  useEffect(() => {
    setCopyOverrides((prev) => {
      if (prev.size === 0) {
        return prev
      }
      const valid = new Set(slots.map((s) => s.key))
      const next = new Map<string, CopyOverride>()
      for (const [key, value] of prev) {
        if (valid.has(key)) {
          next.set(key, value)
        }
      }
      return next.size === prev.size ? prev : next
    })
  }, [slots])

  const creativeCount = slots.length
  const creativeKeys = useMemo(() => slots.map((s) => s.key), [slots])
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
    || duplicates.length > 0
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
  ), [files, assets, duplicates, adNames, copyOverrides, pageTokens, targeting, copy])

  // Add another ad slot for an existing creative, so it can publish again with its
  // own copy. New duplicates start blank (inherit the shared copy until edited).
  const duplicateCreative = useCallback((sourceKey: string) => {
    setDuplicates((prev) => [...prev, makeDuplicate(sourceKey)])
  }, [])

  const removeDuplicate = useCallback((key: string) => {
    setDuplicates((prev) => prev.filter((d) => d.key !== key))
  }, [])

  // Reset the whole draft back to a blank slate. The launch queue is intentionally
  // left untouched — those are ads already on their way, not part of this draft.
  const resetDraft = useCallback(() => {
    setFiles([])
    setAssets([])
    setDuplicates([])
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
    setDuplicates([])
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
    slots,
    duplicateCreative,
    removeDuplicate,
    creativeCount,
    emptyRequired,
    addedAssetKeys,
    canSubmit,
    isDirty,
    resetDraft,
    clearForNextBatch,
  }
}
