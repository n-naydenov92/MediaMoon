import { describe, expect, it } from 'vitest'
import { checkRoleGrant, checkRolePermissions, effectivePermissions, leavesAnOwner } from './grantRules'
import {
  BG,
  WORKSPACE,
  WORKSPACE_ID,
  at,
  brandScope,
  marketScope,
  memberWith,
  ownerOf,
  role,
} from './testFixtures'

const ROLE_MANAGER = memberWith(role(WORKSPACE, ['roles.manage', 'meta-ads.performance.view']))
const MEMBER_MANAGER = memberWith(role(WORKSPACE, ['members.manage', 'meta-ads.performance.view']))

describe('checkRolePermissions', () => {
  it('lets an owner build a role from any permission that is not owner-only', () => {
    const result = checkRolePermissions(ownerOf(), WORKSPACE_ID, ['members.manage', 'meta-ads.creator.use'])
    expect(result).toEqual({ ok: true })
  })

  it('keeps owner-only permissions out of every role, even an owner\'s', () => {
    const result = checkRolePermissions(ownerOf(), WORKSPACE_ID, ['billing.manage'])
    expect(result).toEqual({ ok: false, reason: 'owner-only-permission' })
  })

  it('refuses permission keys it does not know', () => {
    const result = checkRolePermissions(ownerOf(), WORKSPACE_ID, ['meta-ads.everything'])
    expect(result).toEqual({ ok: false, reason: 'unknown-permission' })
  })

  it('refuses people without roles.manage', () => {
    const result = checkRolePermissions(MEMBER_MANAGER, WORKSPACE_ID, ['meta-ads.performance.view'])
    expect(result).toEqual({ ok: false, reason: 'not-allowed' })
  })

  it('lets a role manager use only permissions they hold themselves', () => {
    expect(checkRolePermissions(ROLE_MANAGER, WORKSPACE_ID, ['meta-ads.performance.view'])).toEqual({ ok: true })
    expect(checkRolePermissions(ROLE_MANAGER, WORKSPACE_ID, ['meta-ads.creator.use'])).toEqual({
      ok: false,
      reason: 'exceeds-own-access',
    })
  })
})

describe('checkRoleGrant', () => {
  it('refuses people without members.manage', () => {
    const result = checkRoleGrant(ROLE_MANAGER, at(brandScope()), ['meta-ads.performance.view'])
    expect(result).toEqual({ ok: false, reason: 'not-allowed' })
  })

  it('lets a member manager give a role within their own access', () => {
    const result = checkRoleGrant(MEMBER_MANAGER, at(marketScope(BG)), ['meta-ads.performance.view'])
    expect(result).toEqual({ ok: true })
  })

  it('refuses a role stronger than the giver\'s own access', () => {
    const result = checkRoleGrant(MEMBER_MANAGER, at(brandScope()), ['meta-ads.creator.use'])
    expect(result).toEqual({ ok: false, reason: 'exceeds-own-access' })
  })

  it('checks only the permissions that take effect at the scope given', () => {
    const result = checkRoleGrant(MEMBER_MANAGER, at(marketScope(BG)), ['dashboard.view', 'meta-ads.performance.view'])
    expect(result).toEqual({ ok: true })
  })
})

describe('effectivePermissions', () => {
  it('drops unknown, owner-only and higher-level permissions', () => {
    const permissions = ['workspace.delete', 'members.view', 'dashboard.view', 'google-ads.view', 'nope']
    expect(effectivePermissions(permissions, WORKSPACE)).toEqual(['members.view', 'dashboard.view', 'google-ads.view'])
    expect(effectivePermissions(permissions, brandScope())).toEqual(['dashboard.view', 'google-ads.view'])
    expect(effectivePermissions(permissions, marketScope(BG))).toEqual(['google-ads.view'])
  })
})

describe('leavesAnOwner', () => {
  it('refuses to remove the last owner', () => {
    expect(leavesAnOwner(['user-a'], 'user-a')).toBe(false)
  })

  it('allows it while another owner remains', () => {
    expect(leavesAnOwner(['user-a', 'user-b'], 'user-a')).toBe(true)
  })
})
