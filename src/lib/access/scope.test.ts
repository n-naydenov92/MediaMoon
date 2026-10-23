import { describe, expect, it } from 'vitest'
import { toScopeKey } from './scope'
import { BG, WORKSPACE, brandScope, marketScope } from './testFixtures'

describe('toScopeKey', () => {
  it('names each scope by its kind and id', () => {
    expect(toScopeKey(WORKSPACE)).toBe('workspace')
    expect(toScopeKey(brandScope())).toBe('brand:sapphire')
    expect(toScopeKey(marketScope(BG))).toBe('market:market-bg')
  })
})
