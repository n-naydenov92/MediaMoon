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

  if (role === 'creative_analyst') {
    return restrictCreativeAnalyst(req)
  }

  if (role && isBrandRestrictedRole(role)) {
    const denial = enforceBrandAccess(req, role)
    if (denial) {
      return denial
    }
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

// Brand-restricted roles (e.g. a single-brand operator) may only touch their own
// brand. The target brand is read from the request — directly via `brandId`, or
// indirectly via the `accountId` of a Meta ad account — and access is denied with
// a 403 for API calls or a redirect to the brand picker for page navigations.
function enforceBrandAccess(req: NextRequest, role: UserRole): NextResponse | null {
  const targetBrandId = resolveTargetBrandId(req)
  if (!targetBrandId || canRoleAccessBrand(role, targetBrandId)) {
    return null
  }
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Forbidden: brand not accessible for your role' }, { status: 403 })
  }
  return NextResponse.redirect(new URL('/brands', req.url))
}

function resolveTargetBrandId(req: NextRequest): string | null {
  const { pathname, searchParams } = req.nextUrl

  const brandParam = searchParams.get('brandId')
  if (brandParam) {
    return brandParam
  }

  const accountId = searchParams.get('accountId')
  if (accountId) {
    return getBusinessManagerForAccount(accountId)?.brandId ?? null
  }

  return pathname.match(/^\/brands\/([^/]+)/)?.[1] ?? null
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
