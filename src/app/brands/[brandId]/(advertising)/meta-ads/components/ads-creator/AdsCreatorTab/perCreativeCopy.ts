import type { CopyValue } from './CopyForm/CopyForm'
import { fileKey } from './CreatorPane/helpers'
import type { AssetCreative } from './assetCreative'

// The copy fields a single creative can diverge on. `name` stays per-ad (handled
// by adNames, keyed page×file) and `activate` is a batch-wide switch, so neither
// is overridable here.
export type CopyOverride = Partial<
  Pick<CopyValue, 'primaryTexts' | 'headlines' | 'description' | 'url' | 'cta'>
>

export type OverridableField = keyof CopyOverride

// 'set'   → inherits the shared copy and that field has a value
// 'empty' → inherits the shared copy but the field is still blank
// 'override' → the creative carries its own value for this field
export type FieldStatus = 'set' | 'empty' | 'override'

// Stable per-creative identity. Files reuse the same key as ad naming so the two
// per-creative maps stay consistent; library assets already carry a stable key.
export function creativeKey(creative: File | AssetCreative): string {
  return creative instanceof File ? fileKey(creative) : creative.assetKey
}

// The effective copy for one creative: the shared base with its overridden
// fields applied on top.
export function resolveCopy(base: CopyValue, override?: CopyOverride): CopyValue {
  return override ? { ...base, ...override } : base
}

function isFilled(value: CopyValue[OverridableField]): boolean {
  if (Array.isArray(value)) {
    return value.some((v) => v.trim() !== '')
  }
  return String(value).trim() !== ''
}

export function fieldStatus(
  base: CopyValue,
  override: CopyOverride | undefined,
  field: OverridableField,
): FieldStatus {
  if (override && override[field] !== undefined) {
    return 'override'
  }
  return isFilled(base[field]) ? 'set' : 'empty'
}

// Set or clear one field's override. A value equal to the base drops back to
// inheritance (no override stored), keeping the map free of redundant entries.
export function withOverrideField<F extends OverridableField>(
  base: CopyValue,
  override: CopyOverride | undefined,
  field: F,
  value: CopyValue[F],
): CopyOverride | null {
  const next: CopyOverride = { ...override }
  const sameAsBase = Array.isArray(value)
    ? JSON.stringify(value) === JSON.stringify(base[field])
    : value === base[field]
  if (sameAsBase) {
    delete next[field]
  } else {
    next[field] = value
  }
  return Object.keys(next).length > 0 ? next : null
}
