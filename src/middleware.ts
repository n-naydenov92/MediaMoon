import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse, type NextRequest } from 'next/server'
import { findModuleById } from '@/config/modules'
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

  if (isModuleRoute(req)) {
    const moduleId = extractModuleId(req.nextUrl.pathname)
    if (!isRoleAllowed(role, moduleId)) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  if (isBrandRoute(req)) {
    const moduleId = req.nextUrl.pathname.match(/^\/brands\/[^/]+\/([^/]+)/)?.[1] ?? null
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

function extractModuleId(pathname: string): string | null {
  const match = pathname.match(/^\/modules\/([^/]+)/)
  return match?.[1] ?? null
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
