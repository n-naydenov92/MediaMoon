// An existing Meta creative pulled from the library and queued alongside freshly
// uploaded files. Its media lives in some (possibly different) ad account, so at
// publish time it is re-uploaded into the target account rather than referenced
// by hash/id directly (hashes and video ids are per-account).
export interface AssetCreative {
  readonly assetKey: string
  readonly mediaType: 'image' | 'video'
  readonly imageUrl: string | null
  readonly videoId: string | null
  readonly thumbnailUrl: string | null
  readonly name: string
}

export function assetMediaToken(asset: AssetCreative): 'Video' | 'IMG' {
  return asset.mediaType === 'video' ? 'Video' : 'IMG'
}

// Dedupe by the stable asset key so the same library creative can't be queued
// twice; preserves order.
export function addAsset(
  assets: readonly AssetCreative[],
  next: AssetCreative,
): readonly AssetCreative[] {
  if (assets.some((a) => a.assetKey === next.assetKey)) {
    return assets
  }
  return [...assets, next]
}

export function removeAsset(
  assets: readonly AssetCreative[],
  assetKey: string,
): readonly AssetCreative[] {
  return assets.filter((a) => a.assetKey !== assetKey)
}

export function hasAsset(assets: readonly AssetCreative[], assetKey: string): boolean {
  return assets.some((a) => a.assetKey === assetKey)
}
