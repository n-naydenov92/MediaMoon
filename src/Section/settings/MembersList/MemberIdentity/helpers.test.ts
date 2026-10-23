import { describe, expect, it } from 'vitest'
import { displayName, initialOf } from './helpers'

describe('displayName', () => {
  it('prefers the name, then the email', () => {
    expect(displayName({ name: 'Ivan Petrov', email: 'ivan@example.com' })).toBe('Ivan Petrov')
    expect(displayName({ name: null, email: 'ivan@example.com' })).toBe('ivan@example.com')
    expect(displayName({ name: '  ', email: 'ivan@example.com' })).toBe('ivan@example.com')
    expect(displayName({ name: null, email: '' })).toBe('Unnamed')
  })
})

describe('initialOf', () => {
  it('takes the first letter of what is shown, upper-cased', () => {
    expect(initialOf({ name: 'ivan', email: 'x@example.com' })).toBe('I')
    expect(initialOf({ name: null, email: 'maria@example.com' })).toBe('M')
  })
})
