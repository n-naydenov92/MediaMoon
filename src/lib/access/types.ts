/**
 * The shapes the access rules work on (ADR 0003). The rules are pure: the server
 * loads these from the database and passes them in.
 */

/** How far a permission reaches: the whole workspace, one brand, or one market. */
export type PermissionLevel = 'workspace' | 'brand' | 'market'

/** Where a role is given. A market scope keeps its brand so brand-level questions can be answered. */
export type Scope =
  | { readonly kind: 'workspace' }
  | { readonly kind: 'brand'; readonly brandId: string }
  | { readonly kind: 'market'; readonly brandId: string; readonly marketId: string }

/** One custom role given to a member. Permissions are raw database strings; unknown ones grant nothing. */
export interface Assignment {
  readonly permissions: readonly string[]
  readonly scope: Scope
}

export interface Membership {
  readonly workspaceId: string
  readonly isOwner: boolean
  readonly assignments: readonly Assignment[]
}

/** Everything one signed-in person may do: their memberships, nothing else. */
export interface AccessContext {
  readonly memberships: readonly Membership[]
}

export interface AccessTarget {
  readonly workspaceId: string
  readonly scope: Scope
}

export interface BrandRef {
  readonly workspaceId: string
  readonly brandId: string
  readonly marketIds: readonly string[]
}
