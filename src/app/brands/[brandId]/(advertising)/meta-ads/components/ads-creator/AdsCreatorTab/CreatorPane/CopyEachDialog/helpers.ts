import type { AssetCreative } from '../../assetCreative'
import type { FeedMedia } from '../../AdFeedCard/helpers'
import { creativeKey, type CopyOverride } from '../../perCreativeCopy'
import type { CreativeSlot } from '../../creativeSlots'

export interface CreativeItem {
  readonly key: string
  // The creative this slot is backed by — equals `key` for an original, the source's
  // key for a duplicate. Drives the "duplicate this creative" action.
  readonly sourceKey: string
  readonly isDuplicate: boolean
  readonly name: string
  readonly thumbUrl: string | null
  readonly media: FeedMedia | null
}

// Library assets already expose hosted URLs, so no object URL is needed.
export function assetItem(asset: AssetCreative): CreativeItem {
  const url = asset.imageUrl ?? asset.thumbnailUrl
  return {
    key: asset.assetKey,
    sourceKey: asset.assetKey,
    isDuplicate: false,
    name: asset.name,
    thumbUrl: asset.thumbnailUrl ?? asset.imageUrl,
    media: url ? { url, name: asset.name, isVideo: asset.mediaType === 'video' } : null,
  }
}

// Freshly uploaded files preview from an object URL minted by the caller (so it
// can revoke it on unmount).
export function fileItem(file: File, objectUrl: string): CreativeItem {
  const isVideo = file.type.startsWith('video/')
  const key = creativeKey(file)
  return {
    key,
    sourceKey: key,
    isDuplicate: false,
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
    sourceKey: slot.sourceKey,
    isDuplicate: true,
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
