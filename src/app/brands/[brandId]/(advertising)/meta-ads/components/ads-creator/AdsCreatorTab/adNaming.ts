import type { Page } from '@/lib/gateways/MetaAdsGateway'
import { assetMediaToken, type AssetCreative } from './assetCreative'
import type { CreativeSlot } from './creativeSlots'
import { fileKey, mapWith } from './CreatorPane/helpers'

// Ad naming stores only its inputs — the template, page tokens and the names typed by
// hand — and derives every final name from them. Storing the derived names instead
// forced each template keystroke to regenerate them all, wiping manual edits.

export interface AdNameTags {
  readonly product: string
  readonly creativeInfo: string
  readonly textType: string
  readonly destination: string
}

export const EMPTY_AD_NAME_TAGS: AdNameTags = {
  product: '',
  creativeInfo: '',
  textType: '',
  destination: '',
}

export type NamingMode = 'tags' | 'custom'

export interface AdNameTemplate {
  readonly mode: NamingMode
  readonly tags: AdNameTags
  readonly customName: string
}

export interface AdNaming {
  readonly template: AdNameTemplate
  readonly pageTokens: ReadonlyMap<string, string>
  // Names typed by hand, keyed per ad. They survive template edits until reset.
  readonly overrides: ReadonlyMap<string, string>
}

export const EMPTY_AD_NAMING: AdNaming = {
  template: { mode: 'tags', tags: EMPTY_AD_NAME_TAGS, customName: '' },
  pageTokens: new Map(),
  overrides: new Map(),
}

// The free fields the operator overwrites in the generated name string. The
// destination (e.g. PP/HP) is appended after the page token, so it is its own
// trailing placeholder rather than part of this list.
const PLACEHOLDER_PARTS = ['Product', 'CreativeInfo', 'TextType'] as const
const DESTINATION_PLACEHOLDER = 'Dest'

// Free text shares the "-" field separator, so collapse internal whitespace to
// "-" and trim — keeps each authored value as one readable token.
function sanitizeTag(value: string): string {
  return value.trim().replace(/\s+/g, '-')
}

function mediaToken(file: File): 'Video' | 'IMG' {
  return file.type.startsWith('video/') ? 'Video' : 'IMG'
}

function monthToken(now: Date): string {
  return now.toLocaleString('en-US', { month: 'short' })
}

// A creative the operator can name per ad — a freshly uploaded file or a library
// asset. Both reduce to a stable key, a display name, a media token, and (for
// assets) the descriptive name to use as the editable default.
export interface NameableCreative {
  readonly key: string
  readonly name: string
  readonly media: 'Video' | 'IMG'
  readonly baseName: string | null
}

function fileNameable(file: File): NameableCreative {
  return { key: fileKey(file), name: file.name, media: mediaToken(file), baseName: null }
}

function assetNameable(asset: AssetCreative): NameableCreative {
  return { key: asset.assetKey, name: asset.name, media: assetMediaToken(asset), baseName: asset.name }
}

// A creative slot (original or duplicate) as a nameable. A duplicate reuses its
// source's media but takes the slot's own key and a "(copy N)" display name, so the
// naming UI and the ad-name map treat it as a separate, distinguishable ad.
export function slotNameable(slot: CreativeSlot): NameableCreative {
  const base = slot.source.kind === 'file'
    ? fileNameable(slot.source.file)
    : assetNameable(slot.source.asset)
  return slot.isDuplicate
    ? { ...base, key: slot.key, name: `${base.name} (copy ${slot.copyIndex})` }
    : base
}

// The default each ad gets while no template is set. Library assets already carry a
// descriptive name, so they default to it (with the page token appended to keep
// per-page ads distinct). Uploaded files get the structured placeholder skeleton
// {Media}-{Month}-Product-CreativeInfo-TextType-Dest[-{Page}]. `pageTok` is appended
// last, or omitted when ''.
function buildAutoAdName(creative: NameableCreative, pageTok: string, now: Date = new Date()): string {
  if (creative.baseName !== null) {
    return pageTok ? `${creative.baseName}-${pageTok}` : creative.baseName
  }
  return [
    creative.media,
    monthToken(now),
    ...PLACEHOLDER_PARTS,
    DESTINATION_PLACEHOLDER,
    pageTok,
  ]
    .filter(Boolean)
    .join('-')
}

// Same structured shape, but from explicit tag values; empty tags are dropped.
function buildAdNameFromTags(
  creative: NameableCreative,
  pageTok: string,
  tags: AdNameTags,
  now: Date = new Date(),
): string {
  return [
    creative.media,
    monthToken(now),
    sanitizeTag(tags.product),
    sanitizeTag(tags.creativeInfo),
    sanitizeTag(tags.textType),
    sanitizeTag(tags.destination),
    pageTok,
  ]
    .filter(Boolean)
    .join('-')
}

function hasTags(tags: AdNameTags): boolean {
  return Object.values(tags).some((value) => value.trim() !== '')
}

export function adNameMapKey(pageId: string, creativeKey: string): string {
  return `${pageId}::${creativeKey}`
}

// One ad per (page × creative). Each combo carries its page token so callers that
// build names don't re-resolve it per creative.
export interface AdCombo {
  readonly page: Page
  readonly creative: NameableCreative
  readonly key: string
  readonly pageTok: string
}

export function adCombos(
  pages: readonly Page[],
  creatives: readonly NameableCreative[],
  pageTokens: ReadonlyMap<string, string>,
): readonly AdCombo[] {
  return pages.flatMap((page) => {
    const pageTok = pageTokens.get(page.id) ?? ''
    return creatives.map((creative) => ({
      page,
      creative,
      key: adNameMapKey(page.id, creative.key),
      pageTok,
    }))
  })
}

// Only the active mode applies — the other mode's text is kept but ignored, so
// switching back restores it. An empty template falls back to the default skeleton.
export function templateAdName(combo: AdCombo, template: AdNameTemplate): string {
  const customName = template.customName.trim()
  if (template.mode === 'custom' && customName !== '') {
    return combo.pageTok ? `${customName}-${combo.pageTok}` : customName
  }
  if (template.mode === 'tags' && hasTags(template.tags)) {
    return buildAdNameFromTags(combo.creative, combo.pageTok, template.tags)
  }
  return buildAutoAdName(combo.creative, combo.pageTok)
}

// The name that actually publishes: the hand-typed name verbatim, else the template.
// A blank hand-typed name never publishes — it falls back to the template.
export function finalAdName(templateName: string, override: string | undefined): string {
  const typed = override?.trim() ?? ''
  return typed !== '' ? typed : templateName
}

interface BuildAdNameMapInput {
  readonly pages: readonly Page[]
  readonly creatives: readonly NameableCreative[]
  readonly naming: AdNaming
}

export function buildAdNameMap({ pages, creatives, naming }: BuildAdNameMapInput): Map<string, string> {
  return new Map(adCombos(pages, creatives, naming.pageTokens).map((combo) => [
    combo.key,
    finalAdName(templateAdName(combo, naming.template), naming.overrides.get(combo.key)),
  ]))
}

export function hasNamingInput({ template, pageTokens, overrides }: AdNaming): boolean {
  return Object.values(template.tags).some((value) => value !== '')
    || template.customName !== ''
    || pageTokens.size > 0
    || overrides.size > 0
}

export type AdNamingAction =
  | { readonly type: 'setMode'; readonly mode: NamingMode }
  | { readonly type: 'setTag'; readonly field: keyof AdNameTags; readonly value: string }
  | { readonly type: 'setCustomName'; readonly value: string }
  | { readonly type: 'setPageToken'; readonly pageId: string; readonly value: string }
  | { readonly type: 'setOverride'; readonly key: string; readonly value: string; readonly templateName: string }
  | { readonly type: 'commitOverride'; readonly key: string; readonly templateName: string }
  | { readonly type: 'resetOverride'; readonly key: string }
  | { readonly type: 'resetOverrides' }
  | { readonly type: 'clear' }
  | { readonly type: 'prune'; readonly pageIds: ReadonlySet<string>; readonly adKeys: ReadonlySet<string> }

export function adNamingReducer(state: AdNaming, action: AdNamingAction): AdNaming {
  switch (action.type) {
    case 'setMode':
      return withTemplate(state, { mode: action.mode })
    case 'setTag':
      return withTemplate(state, { tags: { ...state.template.tags, [action.field]: action.value } })
    case 'setCustomName':
      return withTemplate(state, { customName: action.value })
    case 'setPageToken':
      return { ...state, pageTokens: mapWith(state.pageTokens, action.pageId, action.value || null) }
    case 'setOverride':
      return setOverride(state, action.key, action.value, action.templateName)
    case 'commitOverride':
      return commitOverride(state, action.key, action.templateName)
    case 'resetOverride':
      return { ...state, overrides: mapWith(state.overrides, action.key, null) }
    case 'resetOverrides':
      return state.overrides.size === 0 ? state : { ...state, overrides: new Map() }
    case 'clear':
      return { ...EMPTY_AD_NAMING, template: { ...EMPTY_AD_NAMING.template, mode: state.template.mode } }
    case 'prune':
      return pruneNaming(state, action.pageIds, action.adKeys)
    default: {
      const unhandled: never = action
      return unhandled
    }
  }
}

function withTemplate(state: AdNaming, patch: Partial<AdNameTemplate>): AdNaming {
  return { ...state, template: { ...state.template, ...patch } }
}

// Typing the template value back stops being an edit right away. Only an exact match
// counts here — the field already shows that text, so dropping the override changes
// nothing on screen and the caret stays put.
function setOverride(state: AdNaming, key: string, value: string, templateName: string): AdNaming {
  const next = value === templateName ? null : value
  if (next === null && !state.overrides.has(key)) {
    return state
  }
  return { ...state, overrides: mapWith(state.overrides, key, next) }
}

// Trimming and blank-handling wait for blur, so emptying a field to retype it doesn't
// snap the template back in mid-edit. A blank name, or one matching the template once
// trimmed, stops being an override and follows the template again.
function commitOverride(state: AdNaming, key: string, templateName: string): AdNaming {
  const current = state.overrides.get(key)
  if (current === undefined) {
    return state
  }
  const trimmed = current.trim()
  const next = trimmed === '' || trimmed === templateName ? null : trimmed
  if (next === current) {
    return state
  }
  return { ...state, overrides: mapWith(state.overrides, key, next) }
}

// Drops tokens for deselected pages and names for ads that no longer exist, so a
// stale entry can't resurface when a creative is re-added later.
function pruneNaming(state: AdNaming, pageIds: ReadonlySet<string>, adKeys: ReadonlySet<string>): AdNaming {
  const pageTokens = keepKeys(state.pageTokens, pageIds)
  const overrides = keepKeys(state.overrides, adKeys)
  if (pageTokens === state.pageTokens && overrides === state.overrides) {
    return state
  }
  return { ...state, pageTokens, overrides }
}

function keepKeys<V>(map: ReadonlyMap<string, V>, valid: ReadonlySet<string>): ReadonlyMap<string, V> {
  const next = new Map([...map].filter(([key]) => valid.has(key)))
  return next.size === map.size ? map : next
}
