import { describe, expect, it } from 'vitest'
import { allowedMarketIds, brandPermissions, can } from './can'
import { ALL_PERMISSIONS } from './permissions'
import {
  BG,
  BRAND,
  ES,
  NOBODY,
  OTHER_BRAND_ID,
  OTHER_WORKSPACE_ID,
  WORKSPACE,
  at,
  brandScope,
  marketScope,
  memberWith,
  ownerOf,
  role,
} from './testFixtures'

describe('can', () => {
  it('lets an owner do everything in their workspace, owner-only actions included', () => {
    const access = ownerOf()
    const targets = [at(WORKSPACE), at(brandScope()), at(marketScope(BG))]
    targets.forEach((target) => {
      ALL_PERMISSIONS.forEach((permission) => {
        expect(can(access, permission, target)).toBe(true)
      })
    })
  })

  it('gives an owner nothing in a workspace they do not belong to', () => {
    expect(can(ownerOf(), 'dashboard.view', at(brandScope(), OTHER_WORKSPACE_ID))).toBe(false)
  })

  it('gives a person without any membership nothing', () => {
    expect(can(NOBODY, 'meta-ads.performance.view', at(marketScope(BG)))).toBe(false)
  })

  it('gives a member without roles nothing', () => {
    expect(can(memberWith(), 'members.view', at(WORKSPACE))).toBe(false)
  })

  it('never grants owner-only permissions through a role', () => {
    const access = memberWith(role(WORKSPACE, ['billing.manage', 'owners.manage', 'workspace.delete']))
    expect(can(access, 'billing.manage', at(WORKSPACE))).toBe(false)
    expect(can(access, 'owners.manage', at(WORKSPACE))).toBe(false)
    expect(can(access, 'workspace.delete', at(WORKSPACE))).toBe(false)
  })

  it('grants exactly the ticked permissions of a custom role', () => {
    const access = memberWith(role(WORKSPACE, ['meta-ads.performance.view']))
    expect(can(access, 'meta-ads.performance.view', at(marketScope(ES)))).toBe(true)
    expect(can(access, 'meta-ads.overview.view', at(marketScope(ES)))).toBe(false)
  })

  it('applies a workspace role to every brand and market', () => {
    const access = memberWith(role(WORKSPACE, ['dashboard.view', 'google-ads.view']))
    expect(can(access, 'dashboard.view', at(brandScope(OTHER_BRAND_ID)))).toBe(true)
    expect(can(access, 'google-ads.view', at(marketScope(BG)))).toBe(true)
  })

  it('limits a brand role to that brand', () => {
    const access = memberWith(role(brandScope(), ['dashboard.view', 'meta-ads.creator.use']))
    expect(can(access, 'dashboard.view', at(brandScope()))).toBe(true)
    expect(can(access, 'meta-ads.creator.use', at(marketScope(ES)))).toBe(true)
    expect(can(access, 'dashboard.view', at(brandScope(OTHER_BRAND_ID)))).toBe(false)
  })

  it('ignores workspace permissions in a role given at a brand', () => {
    const access = memberWith(role(brandScope(), ['members.manage']))
    expect(can(access, 'members.manage', at(WORKSPACE))).toBe(false)
    expect(can(access, 'members.manage', at(brandScope()))).toBe(false)
  })

  it('limits a market role to that market', () => {
    const access = memberWith(role(marketScope(BG), ['meta-ads.performance.view']))
    expect(can(access, 'meta-ads.performance.view', at(marketScope(BG)))).toBe(true)
    expect(can(access, 'meta-ads.performance.view', at(marketScope(ES)))).toBe(false)
  })

  it('keeps a market role away from brand totals', () => {
    const access = memberWith(role(marketScope(BG), ['dashboard.view']))
    expect(can(access, 'dashboard.view', at(brandScope()))).toBe(false)
    expect(can(access, 'dashboard.view', at(marketScope(BG)))).toBe(false)
  })

  it('answers a brand permission asked in a market from the brand', () => {
    const access = memberWith(role(brandScope(), ['dashboard.view']))
    expect(can(access, 'dashboard.view', at(marketScope(BG)))).toBe(true)
  })

  it('does not treat one market as the whole brand', () => {
    const access = memberWith(role(marketScope(BG), ['meta-ads.performance.view']))
    expect(can(access, 'meta-ads.performance.view', at(brandScope()))).toBe(false)
  })

  it('adds up several roles', () => {
    const access = memberWith(
      role(marketScope(BG), ['meta-ads.performance.view']),
      role(marketScope(ES), ['meta-ads.overview.view']),
    )
    expect(can(access, 'meta-ads.performance.view', at(marketScope(BG)))).toBe(true)
    expect(can(access, 'meta-ads.overview.view', at(marketScope(ES)))).toBe(true)
    expect(can(access, 'meta-ads.overview.view', at(marketScope(BG)))).toBe(false)
  })

  it('grants nothing for permission keys it does not know', () => {
    const access = memberWith(role(WORKSPACE, ['meta-ads.everything', '', 'DASHBOARD.VIEW']))
    expect(can(access, 'dashboard.view', at(brandScope()))).toBe(false)
  })
})

describe('allowedMarketIds', () => {
  it('returns only the markets a role reaches, so "All" means all of mine', () => {
    const access = memberWith(role(marketScope(ES), ['meta-ads.overview.view']))
    expect(allowedMarketIds(access, 'meta-ads.overview.view', BRAND)).toEqual([ES])
  })

  it('returns every market for a brand role and none without access', () => {
    const access = memberWith(role(brandScope(), ['meta-ads.overview.view']))
    expect(allowedMarketIds(access, 'meta-ads.overview.view', BRAND)).toEqual([BG, ES])
    expect(allowedMarketIds(NOBODY, 'meta-ads.overview.view', BRAND)).toEqual([])
  })
})

describe('brandPermissions', () => {
  it('lists brand permissions for the brand and market permissions held in any market', () => {
    const access = memberWith(
      role(brandScope(), ['dashboard.view']),
      role(marketScope(ES), ['meta-ads.performance.view']),
    )
    expect(brandPermissions(access, BRAND)).toEqual(['dashboard.view', 'meta-ads.performance.view'])
  })

  it('lists nothing for a brand without markets when only market permissions are held', () => {
    const access = memberWith(role(brandScope(), ['google-ads.view']))
    expect(brandPermissions(access, { ...BRAND, marketIds: [] })).toEqual([])
  })
})
