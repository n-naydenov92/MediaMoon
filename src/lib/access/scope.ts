import type { PermissionLevel, Scope } from './types'

const WORKSPACE_SCOPE: Scope = { kind: 'workspace' }

const DEPTH: Readonly<Record<PermissionLevel, number>> = { workspace: 0, brand: 1, market: 2 }

/** The stored form of a scope, unique per member and role: `workspace`, `brand:<id>` or `market:<id>`. */
export function toScopeKey(scope: Scope): string {
  switch (scope.kind) {
    case 'workspace':
      return 'workspace'
    case 'brand':
      return `brand:${scope.brandId}`
    case 'market':
      return `market:${scope.marketId}`
  }
}

/** Whether `outer` reaches everything `inner` reaches. */
export function covers(outer: Scope, inner: Scope): boolean {
  if (outer.kind === 'workspace') {
    return true
  }
  if (outer.kind === 'brand') {
    return inner.kind !== 'workspace' && inner.brandId === outer.brandId
  }
  return inner.kind === 'market' && inner.marketId === outer.marketId && inner.brandId === outer.brandId
}

/** A role given at this scope carries only permissions of its own level or below. */
export function carriesLevel(scope: Scope, level: PermissionLevel): boolean {
  return DEPTH[level] >= DEPTH[scope.kind]
}

/**
 * The scope a permission of `level` is checked at. Asking about a brand permission
 * in a market is a question about that market's brand.
 */
export function scopeAtLevel(scope: Scope, level: PermissionLevel): Scope {
  if (DEPTH[scope.kind] <= DEPTH[level]) {
    return scope
  }
  if (level === 'brand' && scope.kind === 'market') {
    return { kind: 'brand', brandId: scope.brandId }
  }
  return WORKSPACE_SCOPE
}
