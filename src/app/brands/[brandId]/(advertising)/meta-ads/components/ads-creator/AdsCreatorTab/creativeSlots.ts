import type { AssetCreative } from './assetCreative'
import { creativeKey } from './perCreativeCopy'

// A duplicate is an extra ad slot that reuses one uploaded file or library asset as
// its media but carries its own copy and name under a distinct key. It lets a single
// creative go out as several ads with different text, without re-uploading the media.
export interface CreativeDuplicate {
  readonly key: string
  readonly sourceKey: string
}

export type CreativeSource =
  | { readonly kind: 'file'; readonly file: File }
  | { readonly kind: 'asset'; readonly asset: AssetCreative }

export interface CreativeSlot {
  readonly key: string
  readonly sourceKey: string
  readonly source: CreativeSource
  readonly isDuplicate: boolean
  // 0 for the original, 1..N for its duplicates — drives the "(copy N)" label.
  readonly copyIndex: number
}

export function makeDuplicate(sourceKey: string): CreativeDuplicate {
  return { key: `${sourceKey}#${crypto.randomUUID()}`, sourceKey }
}

// Flatten files + assets + their duplicates into the ordered ad-slot list every
// downstream step keys off (validation, naming, the per-creative rail, publish).
// Each original is immediately followed by its own duplicates; orphan duplicates
// whose source is gone are dropped.
export function buildCreativeSlots(
  files: readonly File[],
  assets: readonly AssetCreative[],
  duplicates: readonly CreativeDuplicate[],
): readonly CreativeSlot[] {
  const slots: CreativeSlot[] = []
  const emit = (sourceKey: string, source: CreativeSource): void => {
    slots.push({
      key: sourceKey, sourceKey, source, isDuplicate: false, copyIndex: 0,
    })
    duplicates
      .filter((d) => d.sourceKey === sourceKey)
      .forEach((d, i) => slots.push({
        key: d.key, sourceKey, source, isDuplicate: true, copyIndex: i + 1,
      }))
  }
  for (const file of files) {
    emit(creativeKey(file), { kind: 'file', file })
  }
  for (const asset of assets) {
    emit(asset.assetKey, { kind: 'asset', asset })
  }
  return slots
}

// Keys still backed by a present source — used to prune duplicates whose original
// file/asset was removed.
export function liveSourceKeys(
  files: readonly File[],
  assets: readonly AssetCreative[],
): ReadonlySet<string> {
  const keys = new Set<string>()
  for (const file of files) {
    keys.add(creativeKey(file))
  }
  for (const asset of assets) {
    keys.add(asset.assetKey)
  }
  return keys
}
