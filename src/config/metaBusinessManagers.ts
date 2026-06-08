import type { BrandId } from './brands'

export interface MetaBusinessManager {
  readonly id: string
  readonly label: string
  readonly brandId: BrandId
  readonly tokenEnvVar: string
  readonly accountIds: readonly string[]
}

export const BUSINESS_MANAGERS: readonly MetaBusinessManager[] = [
  {
    id: 'stoitchkov-bm',
    label: 'Stoitchkov BM',
    brandId: 'stoitchkov',
    tokenEnvVar: 'META_TOKEN_STOITCHKOV',
    accountIds: ['act_25619246591017712', 'act_1636391154174858'],
  },
  {
    id: 'sapphire-bm',
    label: 'Sapphire BM',
    brandId: 'sapphire',
    tokenEnvVar: 'META_TOKEN_SAPPHIRE',
    accountIds: ['act_734480455547742', 'act_1578892512968195'],
  },
  {
    id: 'thegreenbear-bm-primary',
    label: 'TheGreenBear BM (primary)',
    brandId: 'thegreenbear',
    tokenEnvVar: 'META_TOKEN_THEGREENBEAR',
    accountIds: ['act_222478775571065', 'act_1167235697880563'],
  },
  {
    id: 'thegreenbear-bm-secondary',
    label: 'TheGreenBear BM (secondary)',
    brandId: 'thegreenbear',
    tokenEnvVar: 'META_TOKEN_THEGREENBEAR_2',
    accountIds: ['act_639771789949515'],
  },
  {
    id: 'bubullincas-bm',
    label: 'Bubullincas BM',
    brandId: 'bubullincas',
    tokenEnvVar: 'META_TOKEN_BUBULLINCAS',
    accountIds: ['act_1073479967115320'],
  },
]

export function normalizeAccountId(id: string): string {
  return id.startsWith('act_') ? id : `act_${id}`
}

export function getBusinessManagerForAccount(accountId: string): MetaBusinessManager | null {
  const normalized = normalizeAccountId(accountId)
  return BUSINESS_MANAGERS.find((bm) => bm.accountIds.includes(normalized)) ?? null
}

// Two ad accounts share a Business Manager when the same BM token can reach both.
// That is exactly the boundary for reusing a library video's id: video ids are not
// downloadable, but they are referenceable by any account the token can see.
export function sameBusinessManager(a: string, b: string): boolean {
  const x = getBusinessManagerForAccount(a)
  const y = getBusinessManagerForAccount(b)
  return x !== null && y !== null && x.id === y.id
}

// Canonical user-facing reason a library video can't be used for the chosen account.
// Lives here because it states the same BM rule as sameBusinessManager; shared by the
// client (library badge / added-row error) and the publish API's defensive 422.
export const CROSS_BM_VIDEO_REASON = 'This video is from a different Business Manager — it can’t be used '
  + 'with the selected account. Upload the video file directly, or pick an account in the same '
  + 'Business Manager.'

// Short badge label for a cross-BM video, shown on the library card and the added-row.
// Kept to a single word; the full reason lives in the tooltip.
// Single source so the wording stays identical everywhere.
export const CROSS_BM_BADGE = 'Unavailable'

export function getBusinessManagersForBrand(brandId: BrandId): readonly MetaBusinessManager[] {
  return BUSINESS_MANAGERS.filter((bm) => bm.brandId === brandId)
}
