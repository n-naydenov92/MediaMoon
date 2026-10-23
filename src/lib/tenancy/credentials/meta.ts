import 'server-only'
import { activeSource } from '../source/activeSource'
import type { MetaConnectionRecord } from '../source/types'
import type { MetaAccountTokenLookup, MetaConnection } from '../types'
import { readSecret } from './secrets'

// Only connections whose token is configured are returned.
export async function getMetaConnectionsForBrand(brandId: string): Promise<readonly MetaConnection[]> {
  const records = await activeSource.readMetaConnections(brandId)
  return records.flatMap((record) => {
    const token = readSecret(record.tokenEnvVar)
    return token ? [toMetaConnection(record, token)] : []
  })
}

export async function lookupMetaTokenForAccount(accountId: string): Promise<MetaAccountTokenLookup> {
  const record = await activeSource.readMetaConnectionForAccount(accountId)
  if (!record) {
    return { status: 'unknown-account' }
  }
  const token = readSecret(record.tokenEnvVar)
  if (!token) {
    return { status: 'no-token' }
  }
  return { status: 'found', token, brandId: record.brandId }
}

export async function getMetaTokenForAccount(accountId: string): Promise<string | null> {
  const lookup = await lookupMetaTokenForAccount(accountId)
  return lookup.status === 'found' ? lookup.token : null
}

// Two ad accounts share a connection when the same token can reach both. That is
// exactly the boundary for reusing a library video's id: video ids are not
// downloadable, but they are referenceable by any account the token can see.
export async function areOnSameMetaConnection(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all([
    activeSource.readMetaConnectionForAccount(a),
    activeSource.readMetaConnectionForAccount(b),
  ])
  return x !== null && y !== null && x.id === y.id
}

function toMetaConnection(record: MetaConnectionRecord, token: string): MetaConnection {
  return { id: record.id, label: record.label, token, accountIds: record.accountIds }
}
