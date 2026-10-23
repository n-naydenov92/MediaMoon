/** A workspace as navigation links to it. */
export interface WorkspaceLink {
  readonly slug: string
  readonly name: string
}

/** Where a member's role applies, ready to show. */
export type MemberAccessPlace =
  | { readonly kind: 'workspace' }
  | { readonly kind: 'brand'; readonly brandName: string }
  | { readonly kind: 'market'; readonly brandName: string; readonly marketCode: string }

export interface MemberAccess {
  readonly id: string
  readonly roleName: string
  readonly place: MemberAccessPlace
}

export interface WorkspaceMemberView {
  readonly id: string
  readonly name: string | null
  readonly email: string
  readonly imageUrl: string | null
  readonly isOwner: boolean
  readonly access: readonly MemberAccess[]
}
