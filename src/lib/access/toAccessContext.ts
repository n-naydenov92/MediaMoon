import type { AccessContext, Assignment, Membership, Scope } from './types'

/** A membership as the access query loads it from the database. */
export interface MembershipRow {
  readonly workspaceId: string
  readonly isOwner: boolean
  readonly workspace: { readonly deletedAt: Date | null }
  readonly assignments: readonly AssignmentRow[]
}

interface AssignmentRow {
  readonly brandId: string | null
  readonly marketId: string | null
  readonly role: { readonly permissions: readonly string[] }
}

const WORKSPACE_SCOPE: Scope = { kind: 'workspace' }

/** Turns loaded memberships into what the access rules read. A deleted workspace grants nothing. */
export function toAccessContext(rows: readonly MembershipRow[]): AccessContext {
  return { memberships: rows.filter((row) => row.workspace.deletedAt === null).map(toMembership) }
}

function toMembership(row: MembershipRow): Membership {
  return {
    workspaceId: row.workspaceId,
    isOwner: row.isOwner,
    assignments: row.assignments.flatMap(toAssignments),
  }
}

// An assignment whose scope can't be read is dropped, never widened to the workspace.
function toAssignments(row: AssignmentRow): readonly Assignment[] {
  const scope = toScope(row)
  return scope ? [{ permissions: row.role.permissions, scope }] : []
}

function toScope({ brandId, marketId }: AssignmentRow): Scope | null {
  if (marketId) {
    return brandId ? { kind: 'market', brandId, marketId } : null
  }
  return brandId ? { kind: 'brand', brandId } : WORKSPACE_SCOPE
}
