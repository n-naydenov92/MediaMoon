import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { BrandId } from '@/types'
import { getBrandContext, getMetaConnectionsForBrand, lookupMetaTokenForAccount } from '@/lib/tenancy'

const NO_TOKEN_STATUS = 503

export type BrandTokenResult =
  | { readonly ok: true; readonly token: string; readonly brandId: BrandId }
  | { readonly ok: false; readonly response: NextResponse }

export type AccountTokenResult =
  | { readonly ok: true; readonly token: string; readonly accountId: string; readonly brandId: BrandId }
  | { readonly ok: false; readonly response: NextResponse }

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export async function resolveBrandTokenFromRequest(request: NextRequest): Promise<BrandTokenResult> {
  return resolveBrandToken(request.nextUrl.searchParams.get('brandId'))
}

export async function resolveBrandToken(brandIdRaw: string | null | undefined): Promise<BrandTokenResult> {
  if (!brandIdRaw) {
    return { ok: false, response: jsonError('brandId query param is required', 400) }
  }
  const ctx = await getBrandContext(brandIdRaw)
  if (!ctx) {
    return { ok: false, response: jsonError(`unknown brandId: ${brandIdRaw}`, 400) }
  }
  const [connection] = await getMetaConnectionsForBrand(ctx.brand.id)
  if (!connection) {
    return { ok: false, response: jsonError(`Meta token not configured for brand "${brandIdRaw}"`, NO_TOKEN_STATUS) }
  }
  return { ok: true, token: connection.token, brandId: ctx.brand.id }
}

export async function resolveAccountTokenFromRequest(request: NextRequest): Promise<AccountTokenResult> {
  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) {
    return { ok: false, response: jsonError('accountId query param is required', 400) }
  }
  const lookup = await lookupMetaTokenForAccount(accountId)
  if (lookup.status === 'unknown-account') {
    return { ok: false, response: jsonError(`unknown accountId: ${accountId}`, 400) }
  }
  if (lookup.status === 'no-token') {
    return { ok: false, response: jsonError(`Meta token not configured for account "${accountId}"`, NO_TOKEN_STATUS) }
  }
  return { ok: true, token: lookup.token, accountId, brandId: lookup.brandId }
}
