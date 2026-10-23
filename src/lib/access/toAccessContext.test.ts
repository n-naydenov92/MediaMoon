import { describe, expect, it } from 'vitest'
import { can } from './can'
import { BG, BRAND_ID, WORKSPACE_ID, at, marketScope } from './testFixtures'
import { toAccessContext, type MembershipRow } from './toAccessContext'

const LIVE = { deletedAt: null }

function membership(overrides: Partial<MembershipRow>): MembershipRow {
  return { workspaceId: WORKSPACE_ID, isOwner: false, workspace: LIVE, assignments: [], ...overrides }
}

function given(
  brandId: string | null,
  marketId: string | null,
  permissions: readonly string[],
): MembershipRow['assignments'][number] {
  return { brandId, marketId, role: { permissions } }
}

describe('toAccessContext', () => {
  it('keeps owners as owners', () => {
    const access = toAccessContext([membership({ isOwner: true })])
    expect(access.memberships).toEqual([{ workspaceId: WORKSPACE_ID, isOwner: true, assignments: [] }])
  })

  it('reads each assignment\'s scope from its brand and market columns', () => {
    const access = toAccessContext([membership({
      assignments: [
        given(null, null, ['members.view']),
        given(BRAND_ID, null, ['dashboard.view']),
        given(BRAND_ID, BG, ['meta-ads.performance.view']),
      ],
    })])
    expect(access.memberships[0]?.assignments.map((assignment) => assignment.scope)).toEqual([
      { kind: 'workspace' },
      { kind: 'brand', brandId: BRAND_ID },
      { kind: 'market', brandId: BRAND_ID, marketId: BG },
    ])
  })

  it('grants nothing in a deleted workspace', () => {
    const access = toAccessContext([membership({ isOwner: true, workspace: { deletedAt: new Date() } })])
    expect(access.memberships).toEqual([])
  })

  it('drops an assignment with a market but no brand instead of widening it', () => {
    const access = toAccessContext([membership({ assignments: [given(null, BG, ['meta-ads.performance.view'])] })])
    expect(can(access, 'meta-ads.performance.view', at(marketScope(BG)))).toBe(false)
    expect(access.memberships[0]?.assignments).toEqual([])
  })
})
