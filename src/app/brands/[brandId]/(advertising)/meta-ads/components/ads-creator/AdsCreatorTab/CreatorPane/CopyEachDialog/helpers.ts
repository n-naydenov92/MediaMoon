import type { AssetCreative } from '../../assetCreative'
import type { FeedMedia } from '../../AdFeedCard/helpers'
import { creativeKey, type CopyOverride } from '../../perCreativeCopy'

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
