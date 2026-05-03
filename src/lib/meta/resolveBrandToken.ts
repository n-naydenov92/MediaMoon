import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBrandId, type BrandId } from '@/config/brands'
import { getMetaTokenForBrand } from '@/config/metaTokens'
import { getBusinessManagerForAccount } from '@/config/metaBusinessManagers'

export type BrandTokenResult =
  | { readonly ok: true; readonly token: string; readonly brandId: BrandId }
  | { readonly ok: false; readonly response: NextResponse }

export type AccountTokenResult =
  | { readonly ok: true; readonly token: string; readonly accountId: string; readonly brandId: BrandId }
  | { readonly ok: false; readonly response: NextResponse }

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

export function resolveBrandTokenFromRequest(request: NextRequest): BrandTokenResult {
  return resolveBrandToken(request.nextUrl.searchParams.get('brandId'))
}

export function resolveBrandToken(brandIdRaw: string | null | undefined): BrandTokenResult {
  if (!brandIdRaw) {
    return { ok: false, response: jsonError('brandId query param is required', 400) }
  }
  if (!isBrandId(brandIdRaw)) {
    return { ok: false, response: jsonError(`unknown brandId: ${brandIdRaw}`, 400) }
  }
  const token = getMetaTokenForBrand(brandIdRaw)
  if (!token) {
    return { ok: false, response: jsonError(`Meta token not configured for brand "${brandIdRaw}"`, 503) }
  }
  return { ok: true, token, brandId: brandIdRaw }
}

export function resolveAccountTokenFromRequest(request: NextRequest): AccountTokenResult {
  const accountId = request.nextUrl.searchParams.get('accountId')
  if (!accountId) {
    return { ok: false, response: jsonError('accountId query param is required', 400) }
  }
  const businessManager = getBusinessManagerForAccount(accountId)
  if (!businessManager) {
    return { ok: false, response: jsonError(`unknown accountId: ${accountId}`, 400) }
  }
  const token = process.env[businessManager.tokenEnvVar]
  if (!token || token.length === 0) {
    return {
      ok: false,
      response: jsonError(
        `Meta token not configured for account "${accountId}" (expected ${businessManager.tokenEnvVar})`,
        503,
      ),
    }
  }
  return { ok: true, token, accountId, brandId: businessManager.brandId }
}
