// An existing Meta creative pulled from the library and queued alongside freshly
// uploaded files. `accountId` is the source ad account the media lives in. At
// publish time: images are re-uploaded into the target account (image hashes are
// per-account); a video's id is reused directly when the target account is in the
// same Business Manager (video ids are portable within a BM token), otherwise it
// cannot be reused — see the reupload route.
export interface AssetCreative {
  readonly assetKey: string
  readonly accountId: string
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
