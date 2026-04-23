import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { findModuleById } from '@/config/modules'
import { parseRole } from '@/lib/roles'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/unauthorized',
  '/api/webhooks(.*)',
])

const isModuleRoute = createRouteMatcher(['/modules/:moduleId(.*)'])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return NextResponse.next()
  }

  const session = await auth()
  if (!session.userId) {
    return session.redirectToSignIn()
  }

  if (isModuleRoute(req)) {
    const moduleId = extractModuleId(req.nextUrl.pathname)
    const allowed = isRoleAllowed(session.sessionClaims, moduleId)
    if (!allowed) {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
  }

  return NextResponse.next()
})

function extractModuleId(pathname: string): string | null {
  const match = pathname.match(/^\/modules\/([^/]+)/)
  return match?.[1] ?? null
}

function isRoleAllowed(
  claims: Record<string, unknown> | null | undefined,
  moduleId: string | null,
): boolean {
  if (!moduleId) {
    return false
  }
  const moduleConfig = findModuleById(moduleId)
  if (!moduleConfig) {
    return false
  }
  const role = parseRole(claims?.['role'] ?? (claims?.['publicMetadata'] as { role?: unknown } | undefined)?.role)
  if (!role) {
    return false
  }
  return moduleConfig.roles.includes(role)
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)', '/api/(.*)'],
}
