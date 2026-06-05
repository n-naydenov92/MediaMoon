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

// Copy fields Meta rejects when blank, so an empty resolved value here is a publish
// blocker rather than a stylistic choice.
export const REQUIRED_FIELDS = ['primaryTexts', 'headlines'] as const
const REQUIRED_FIELD_SET: ReadonlySet<OverridableField> = new Set(REQUIRED_FIELDS)

// 'set'   → inherits the shared copy and that field has a value
// 'empty' → inherits the shared copy but the field is still blank (optional field)
// 'override' → the creative carries its own value for this field
// 'missing' → a REQUIRED field resolves blank (empty shared inherited, or an empty
//             override) — this creative would publish without it
export type FieldStatus = 'set' | 'empty' | 'override' | 'missing'

function firstFilled(values: readonly string[] | undefined): boolean {
  return (values?.[0] ?? '').trim() !== ''
}

function fieldHasValue(value: CopyValue[OverridableField]): boolean {
  return Array.isArray(value) ? firstFilled(value) : String(value).trim() !== ''
}

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

// `baseFilled` is the pre-computed set of shared fields that hold a value — passed
// in (not derived from the live copy here) so the badge consumers can memoize it on
// filled-ness and skip re-render on every keystroke.
export function fieldStatus(
  baseFilled: ReadonlySet<OverridableField>,
  override: CopyOverride | undefined,
  field: OverridableField,
): FieldStatus {
  const required = REQUIRED_FIELD_SET.has(field)
  const overrideValue = override?.[field]
  if (overrideValue !== undefined) {
    if (required && !fieldHasValue(overrideValue)) {
      return 'missing'
    }
    return 'override'
  }
  if (baseFilled.has(field)) {
    return 'set'
  }
  return required ? 'missing' : 'empty'
}

export interface EmptyRequiredCounts {
  readonly primary: number
  readonly headline: number
}

// How many creatives would publish with a blank required field, counting the
// resolved value (its own override if present, otherwise the shared base). Drives
// the publish block and the "N creatives have an empty …" warnings.
export function countEmptyRequired(
  base: CopyValue,
  overrides: ReadonlyMap<string, CopyOverride>,
  creativeKeys: readonly string[],
): EmptyRequiredCounts {
  let primary = 0
  let headline = 0
  for (const key of creativeKeys) {
    const override = overrides.get(key)
    if (!firstFilled(override?.primaryTexts ?? base.primaryTexts)) {
      primary += 1
    }
    if (!firstFilled(override?.headlines ?? base.headlines)) {
      headline += 1
    }
  }
  return { primary, headline }
}

// How many creatives carry their own value for a field. Drives the shared form's
// "Shared · N customized" chip and the library-Add conflict prompt.
export function overrideCount(
  overrides: ReadonlyMap<string, CopyOverride>,
  field: OverridableField,
): number {
  let count = 0
  for (const override of overrides.values()) {
    if (override[field] !== undefined) {
      count += 1
    }
  }
  return count
}

// Drop one field from every creative's override, so they all fall back to the
// shared value. Used when the operator chooses "Set on all" from the conflict prompt.
export function clearFieldOverrides(
  overrides: ReadonlyMap<string, CopyOverride>,
  field: OverridableField,
): ReadonlyMap<string, CopyOverride> {
  const next = new Map<string, CopyOverride>()
  for (const [key, override] of overrides) {
    const rest: CopyOverride = { ...override }
    delete rest[field]
    if (Object.keys(rest).length > 0) {
      next.set(key, rest)
    }
  }
  return next
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
