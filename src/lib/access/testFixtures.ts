import type { AccessContext, AccessTarget, Assignment, BrandRef, Scope } from './types'

// Builders shared by the access tests. One workspace with one brand and two markets,
// plus a second workspace and brand that nobody in a test should reach by accident.

export const WORKSPACE_ID = 'ws-naydenov'
export const OTHER_WORKSPACE_ID = 'ws-other'
export const BRAND_ID = 'sapphire'
export const OTHER_BRAND_ID = 'stoitchkov'
export const BG = 'market-bg'
export const ES = 'market-es'

export const BRAND: BrandRef = { workspaceId: WORKSPACE_ID, brandId: BRAND_ID, marketIds: [BG, ES] }

export const WORKSPACE: Scope = { kind: 'workspace' }

export function brandScope(brandId: string = BRAND_ID): Scope {
  return { kind: 'brand', brandId }
}

export function marketScope(marketId: string, brandId: string = BRAND_ID): Scope {
  return { kind: 'market', brandId, marketId }
}

export function at(scope: Scope, workspaceId: string = WORKSPACE_ID): AccessTarget {
  return { workspaceId, scope }
}

export function role(scope: Scope, permissions: readonly string[]): Assignment {
  return { scope, permissions }
}

export function memberWith(...assignments: readonly Assignment[]): AccessContext {
  return { memberships: [{ workspaceId: WORKSPACE_ID, isOwner: false, assignments }] }
}

export function ownerOf(workspaceId: string = WORKSPACE_ID): AccessContext {
  return { memberships: [{ workspaceId, isOwner: true, assignments: [] }] }
}

export const NOBODY: AccessContext = { memberships: [] }
