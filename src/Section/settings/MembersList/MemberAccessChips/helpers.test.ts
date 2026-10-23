import { describe, expect, it } from 'vitest'
import { accessLabel } from './helpers'

describe('accessLabel', () => {
  it('names the role and where it applies', () => {
    expect(accessLabel({ id: 'a', roleName: 'Admin', place: { kind: 'workspace' } })).toBe('Admin · Whole workspace')
    expect(accessLabel({ id: 'b', roleName: 'Analyst', place: { kind: 'brand', brandName: 'Sapphire' } }))
      .toBe('Analyst · Brand: Sapphire')
    expect(accessLabel({
      id: 'c',
      roleName: 'Creative Analyst',
      place: { kind: 'market', brandName: 'Stoitchkov', marketCode: 'BG' },
    })).toBe('Creative Analyst · Market: Stoitchkov · BG')
  })
})
