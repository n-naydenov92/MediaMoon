import { describe, expect, it } from 'vitest'
import { can } from './can'
import { applyDevPersona, isDevPersonaAllowed } from './devPersona'
import {
  BG,
  OTHER_WORKSPACE_ID,
  WORKSPACE,
  WORKSPACE_ID,
  at,
  marketScope,
  memberWith,
  ownerOf,
  role,
} from './testFixtures'
import type { AccessContext } from './types'

const ANALYST = { workspaceId: WORKSPACE_ID, permissions: ['meta-ads.performance.view'] }

const OWNER_OF_BOTH: AccessContext = {
  memberships: [...ownerOf().memberships, ...ownerOf(OTHER_WORKSPACE_ID).memberships],
}

describe('isDevPersonaAllowed', () => {
  it('allows it only under next dev outside Vercel', () => {
    expect(isDevPersonaAllowed({ NODE_ENV: 'development' })).toBe(true)
    expect(isDevPersonaAllowed({ NODE_ENV: 'development', VERCEL: '1' })).toBe(false)
    expect(isDevPersonaAllowed({ NODE_ENV: 'production' })).toBe(false)
    expect(isDevPersonaAllowed({})).toBe(false)
  })
})

describe('applyDevPersona', () => {
  it('narrows an owner to exactly the role\'s permissions', () => {
    const access = applyDevPersona(ownerOf(), ANALYST)
    expect(can(access, 'meta-ads.performance.view', at(marketScope(BG)))).toBe(true)
    expect(can(access, 'meta-ads.creator.use', at(marketScope(BG)))).toBe(false)
    expect(can(access, 'billing.manage', at(WORKSPACE))).toBe(false)
  })

  it('leaves nothing in the owner\'s other workspaces', () => {
    const access = applyDevPersona(OWNER_OF_BOTH, ANALYST)
    expect(can(access, 'dashboard.view', at(WORKSPACE, OTHER_WORKSPACE_ID))).toBe(false)
  })

  it('changes nothing for someone who does not own the workspace', () => {
    const member = memberWith(role(WORKSPACE, ['dashboard.view']))
    expect(applyDevPersona(member, ANALYST)).toBe(member)
  })
})
