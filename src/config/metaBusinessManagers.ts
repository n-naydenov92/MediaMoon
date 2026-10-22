import { normalizeAccountId } from '@/lib/meta/accountId'
import type { BrandId } from '@/types'

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
  {
    id: 'monitrade-bm',
    label: 'Moni Trade BM',
    brandId: 'monitrade',
    tokenEnvVar: 'META_TOKEN_MONITRADE',
    accountIds: ['act_181255093815434'],
  },
]

export function getBusinessManagerForAccount(accountId: string): MetaBusinessManager | null {
  const normalized = normalizeAccountId(accountId)
  return BUSINESS_MANAGERS.find((bm) => bm.accountIds.includes(normalized)) ?? null
}
