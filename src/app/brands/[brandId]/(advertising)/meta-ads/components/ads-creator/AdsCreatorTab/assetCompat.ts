import { CROSS_BM_BADGE, CROSS_BM_VIDEO_REASON, sameBusinessManager } from '@/config/metaBusinessManagers'
import type { AssetCreative } from './assetCreative'

const NO_ACCOUNT_REASON = 'Select an account first (Step 1) to add creatives.'

// A library video whose id the target token can't reach (different BM). Images are
// never cross-BM blocked — they are re-uploaded from their URL into any account.
function isCrossBmVideo(
  mediaType: 'image' | 'video' | 'unknown',
  sourceAccountId: string,
  targetAccountId: string,
): boolean {
  return mediaType === 'video' && !sameBusinessManager(sourceAccountId, targetAccountId)
}

export interface AddBlock {
  readonly blocked: boolean
  readonly reason: string
  readonly badge: string
}

const NOT_BLOCKED: AddBlock = { blocked: false, reason: '', badge: '' }

// Whether a library creative can be added for the chosen target account, and why.
// No account yet → blocked (account-first). A video from a different Business Manager
// → blocked (its id is unreachable by the target token and the file can't be copied).
// Images are always allowed — they are re-uploaded from their URL into any account.
export function libraryAddBlock(
  mediaType: 'image' | 'video' | 'unknown',
  sourceAccountId: string,
  targetAccountId: string,
): AddBlock {
  if (targetAccountId === '') {
    // No per-card badge here — a single notice above the grid covers this, so the
    // whole library isn't covered in red badges before an account is picked.
    return { blocked: true, reason: NO_ACCOUNT_REASON, badge: '' }
  }
  if (isCrossBmVideo(mediaType, sourceAccountId, targetAccountId)) {
    return { blocked: true, reason: CROSS_BM_VIDEO_REASON, badge: CROSS_BM_BADGE }
  }
  return NOT_BLOCKED
}

// A library asset that is already added but no longer publishable for the selected
// account (a cross-BM video). Drives the inline error on the added row, the
// incomplete Files step, and the blocked Publish. The "no account yet" case is
// surfaced by the Account step itself, so it is intentionally not flagged here.
export function isAssetIncompatible(asset: AssetCreative, targetAccountId: string): boolean {
  return targetAccountId !== '' && isCrossBmVideo(asset.mediaType, asset.accountId, targetAccountId)
}

export function incompatibleAssetKeys(
  assets: readonly AssetCreative[],
  targetAccountId: string,
): ReadonlySet<string> {
  const out = new Set<string>()
  for (const asset of assets) {
    if (isAssetIncompatible(asset, targetAccountId)) {
      out.add(asset.assetKey)
    }
  }
  return out
}
