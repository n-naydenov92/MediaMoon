import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { findModuleById } from '@/config/modules'
import { canRoleAccessBrand, isBrandRestrictedRole } from '@/config/brandAccess'
import { getBusinessManagerForAccount } from '@/config/metaBusinessManagers'
import { parseRole } from '@/lib/roles'
import type { UserRole } from '@/types'

// Creative analysts are scoped to a single screen — the Meta Ads performance
// page — plus the brand picker. The module registry gates whole modules, not
// pages, so this one sub-path restriction is enforced here in the middleware.
const CREATIVE_ANALYST_AREA = 'meta-ads/performance'

const ACCOUNT_PARAMS = ['accountId', 'account'] as const
const BRAND_PATH = /^\/brands\/([^/]+)/

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/sso-callback(.*)',
  '/unauthorized',
  '/api/webhooks(.*)',
  '/api/inngest(.*)',
])

const isModuleRoute = createRouteMatcher(['/modules/:moduleId(.*)'])
const isBrandRoute = createRouteMatcher(['/brands/:brandId/:moduleId(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const session = await auth()
  if (!session.userId) {
    return session.redirectToSignIn()
  }

  const role = roleFromClaims(session.sessionClaims)
  const denial = role ? enforceBrandAccess(req, role) : denyApiWithoutRole(req)
  if (denial) {
    return denial
  }

  if (role === 'creative_analyst') {
    return restrictCreativeAnalyst(req)
  }

  if (isModuleRoute(req) || isBrandRoute(req)) {
    const moduleId = moduleIdFromRequest(req)
    if (!isRoleAllowed(role, moduleId)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return NextResponse.next()
})

function roleFromClaims(
  claims: Record<string, unknown> | null | undefined,
): UserRole | null {
  return parseRole(claims?.role ?? (claims?.publicMetadata as { role?: unknown } | undefined)?.role)
}

// API routes don't check roles themselves, so a signed-in user without a role
// would otherwise reach every brand's data. Pages are gated by their layouts.
function denyApiWithoutRole(req: NextRequest): NextResponse | null {
  return isApiRequest(req) ? forbidden('Forbidden: no role assigned') : null
}

// Brand-restricted roles (e.g. a single-brand operator) may only touch their own
// brand. Every brand the request names is checked — `brandId`, the brand in the
// path, and the brand behind each ad account id — because the routes read different
// params: a permitted `brandId` must not carry another brand's `accountId` through.
function enforceBrandAccess(req: NextRequest, role: UserRole): NextResponse | null {
  if (targetBrandIds(req).every((brandId) => canAccessTarget(role, brandId))) {
    return null
  }
  if (isApiRequest(req)) {
    return forbidden('Forbidden: brand not accessible for your role')
  }
  return NextResponse.redirect(new URL('/brands', req.url))
}

// `null` stands for an ad account that no Business Manager lists.
function targetBrandIds(req: NextRequest): readonly (string | null)[] {
  const { pathname, searchParams } = req.nextUrl
  const namedBrands = [...searchParams.getAll('brandId'), pathname.match(BRAND_PATH)?.[1]]
    .filter((id): id is string => Boolean(id))
  const accountBrands = ACCOUNT_PARAMS
    .flatMap((param) => searchParams.getAll(param))
    .filter(Boolean)
    .map((accountId) => getBusinessManagerForAccount(accountId)?.brandId ?? null)
  return [...namedBrands, ...accountBrands]
}

// An unlisted account can't be traced to a brand, so roles limited to specific
// brands are refused it; the routes reject it for everyone else.
function canAccessTarget(role: UserRole, brandId: string | null): boolean {
  if (brandId === null) {
    return !isBrandRestrictedRole(role)
  }
  return canRoleAccessBrand(role, brandId)
}

function isApiRequest(req: NextRequest): boolean {
  return req.nextUrl.pathname.startsWith('/api/')
}

function forbidden(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

function restrictCreativeAnalyst(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl

  // API calls (e.g. the performance page's own data fetches) pass through.
  if (pathname.startsWith('/api/') || pathname === '/brands') {
    return NextResponse.next()
  }

  const brandMatch = pathname.match(/^\/brands\/([^/]+)(?:\/(.*))?$/)
  if (brandMatch) {
    const [, brandId, rawSubPath] = brandMatch
    const subPath = (rawSubPath ?? '').replace(/\/$/, '')
    if (subPath === CREATIVE_ANALYST_AREA) {
      return NextResponse.next()
    }
    return NextResponse.redirect(
      new URL(`/brands/${brandId}/${CREATIVE_ANALYST_AREA}`, req.url),
    )
  }

  return NextResponse.redirect(new URL('/brands', req.url))
}

// Resolves the moduleId for both gated route shapes: /modules/:id and
// /brands/:brandId/:id. Returns null when neither pattern matches.
function moduleIdFromRequest(req: NextRequest): string | null {
  const { pathname } = req.nextUrl
  return (
    pathname.match(/^\/modules\/([^/]+)/)?.[1]
    ?? pathname.match(/^\/brands\/[^/]+\/([^/]+)/)?.[1]
    ?? null
  )
}

function isRoleAllowed(role: UserRole | null, moduleId: string | null): boolean {
  if (!role || !moduleId) {
    return false
  }
  const moduleConfig = findModuleById(moduleId)
  if (!moduleConfig) {
    return false
  }
  return moduleConfig.roles.includes(role)
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/api/(.*)'],
}
