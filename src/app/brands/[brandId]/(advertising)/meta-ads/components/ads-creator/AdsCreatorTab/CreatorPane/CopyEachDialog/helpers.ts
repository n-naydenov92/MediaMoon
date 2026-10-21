import type { AssetCreative } from '../../assetCreative'
import type { FeedMedia } from '../../AdFeedCard/helpers'
import { creativeKey, type CopyOverride } from '../../perCreativeCopy'
import type { CreativeSlot } from '../../creativeSlots'
import { adNameMapKey } from '../../adNaming'

export interface CreativeItem {
  readonly key: string
  readonly name: string
  readonly thumbUrl: string | null
  readonly media: FeedMedia | null
}

// Library assets already expose hosted URLs, so no object URL is needed.
export function assetItem(asset: AssetCreative): CreativeItem {
  const url = asset.imageUrl ?? asset.thumbnailUrl
  return {
    key: asset.assetKey,
    name: asset.name,
    thumbUrl: asset.thumbnailUrl ?? asset.imageUrl,
    media: url ? { url, name: asset.name, isVideo: asset.mediaType === 'video' } : null,
  }
}

// Freshly uploaded files preview from an object URL minted by the caller (so it
// can revoke it on unmount).
export function fileItem(file: File, objectUrl: string): CreativeItem {
  const isVideo = file.type.startsWith('video/')
  return {
    key: creativeKey(file),
    name: file.name,
    thumbUrl: isVideo ? null : objectUrl,
    media: { url: objectUrl, name: file.name, isVideo },
  }
}

// One ad slot (original or duplicate) as a display item. A duplicate reuses its
// source's media/thumbnail but carries the slot's own key and a "(copy N)" label.
export function slotItem(
  slot: CreativeSlot,
  fileUrlBySourceKey: ReadonlyMap<string, string>,
): CreativeItem {
  const base = slot.source.kind === 'file'
    ? fileItem(slot.source.file, fileUrlBySourceKey.get(slot.sourceKey) ?? '')
    : assetItem(slot.source.asset)
  if (!slot.isDuplicate) {
    return base
  }
  return {
    ...base,
    key: slot.key,
    name: `${base.name} (copy ${slot.copyIndex})`,
  }
}

// Copy one creative's override onto a set of target creatives ("apply to
// selected"). An empty source clears the targets back to inheritance.
export function applyOverrideToKeys(
  overrides: ReadonlyMap<string, CopyOverride>,
  source: CopyOverride | undefined,
  keys: readonly string[],
): Map<string, CopyOverride> {
  const next = new Map(overrides)
  const hasSource = source !== undefined && Object.keys(source).length > 0
  for (const key of keys) {
    if (hasSource) {
      next.set(key, { ...source })
    } else {
      next.delete(key)
    }
  }
  return next
}

interface RemovalInput {
  readonly slot: CreativeSlot
  readonly slots: readonly CreativeSlot[]
  readonly copyOverrides: ReadonlyMap<string, CopyOverride>
  readonly nameOverrides: ReadonlyMap<string, string>
  readonly pageIds: readonly string[]
}

// What removing a creative throws away besides the media: its own copy, a typed ad
// name and, for an original, its duplicates. Empty when nothing would be lost.
export function removalLosses({
  slot,
  slots,
  copyOverrides,
  nameOverrides,
  pageIds,
}: RemovalInput): readonly string[] {
  const duplicateCount = slot.isDuplicate
    ? 0
    : slots.filter((s) => s.isDuplicate && s.sourceKey === slot.key).length
  return [
    copyOverrides.has(slot.key) ? 'its custom copy' : null,
    pageIds.some((pageId) => nameOverrides.has(adNameMapKey(pageId, slot.key))) ? 'its ad name' : null,
    duplicateCount > 0 ? `${duplicateCount} ${duplicateCount === 1 ? 'duplicate' : 'duplicates'}` : null,
  ].filter((loss): loss is string => loss !== null)
}
