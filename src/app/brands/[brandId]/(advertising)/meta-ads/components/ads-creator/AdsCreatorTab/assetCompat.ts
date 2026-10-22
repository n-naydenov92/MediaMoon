import { CROSS_BM_BADGE, CROSS_BM_VIDEO_REASON } from '@/lib/meta/crossBmMessages'
import type { AssetCreative } from './assetCreative'

const NO_ACCOUNT_REASON = 'Select an account first (Step 1) to add creatives.'

// The ad account the draft publishes to ('' until one is picked) and whether its
// token also reaches a given source account (the same Meta connection).
export interface PublishTarget {
  readonly accountId: string
  readonly sharesConnectionWith: (sourceAccountId: string) => boolean
}

// A library video whose id the target token can't reach (different BM). Images are
// never cross-BM blocked — they are re-uploaded from their URL into any account.
function isCrossBmVideo(
  mediaType: 'image' | 'video' | 'unknown',
  sourceAccountId: string,
  target: PublishTarget,
): boolean {
  return mediaType === 'video' && !target.sharesConnectionWith(sourceAccountId)
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
  target: PublishTarget,
): AddBlock {
  if (target.accountId === '') {
    // No per-card badge here — a single notice above the grid covers this, so the
    // whole library isn't covered in red badges before an account is picked.
    return { blocked: true, reason: NO_ACCOUNT_REASON, badge: '' }
  }
  if (isCrossBmVideo(mediaType, sourceAccountId, target)) {
    return { blocked: true, reason: CROSS_BM_VIDEO_REASON, badge: CROSS_BM_BADGE }
  }
  return NOT_BLOCKED
}

// A library asset that is already added but no longer publishable for the selected
// account (a cross-BM video). Drives the inline error on the added row, the
// incomplete Files step, and the blocked Publish. The "no account yet" case is
// surfaced by the Account step itself, so it is intentionally not flagged here.
export function isAssetIncompatible(asset: AssetCreative, target: PublishTarget): boolean {
  return target.accountId !== '' && isCrossBmVideo(asset.mediaType, asset.accountId, target)
}

export function incompatibleAssetKeys(
  assets: readonly AssetCreative[],
  target: PublishTarget,
): ReadonlySet<string> {
  const out = new Set<string>()
  for (const asset of assets) {
    if (isAssetIncompatible(asset, target)) {
      out.add(asset.assetKey)
    }
  }
  return out
}
