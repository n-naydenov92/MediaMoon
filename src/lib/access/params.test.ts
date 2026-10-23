import { describe, expect, it } from 'vitest'
import { isGraphId, resolveAccountParam, resolveMarketParam } from './params'

const MARKETS = { brandMarkets: ['BG', 'ES', 'RO'], allowedMarkets: ['BG', 'ES'] }
const ALLOWED_ACCOUNTS = ['act_123', 'act_456']

describe('resolveMarketParam', () => {
  it('reads no market and ALL as every market the person may use', () => {
    expect(resolveMarketParam(null, MARKETS)).toEqual({ ok: true, value: ['BG', 'ES'] })
    expect(resolveMarketParam('ALL', MARKETS)).toEqual({ ok: true, value: ['BG', 'ES'] })
  })

  it('narrows to one market the person may use', () => {
    expect(resolveMarketParam('ES', MARKETS)).toEqual({ ok: true, value: ['ES'] })
  })

  it('forbids a market of the brand the person may not use', () => {
    expect(resolveMarketParam('RO', MARKETS)).toEqual({ ok: false, status: 403 })
  })

  it('rejects a market the brand does not have', () => {
    expect(resolveMarketParam('DE', MARKETS)).toEqual({ ok: false, status: 400 })
  })
})

describe('resolveAccountParam', () => {
  it('passes when no account is named', () => {
    expect(resolveAccountParam(null, ALLOWED_ACCOUNTS)).toEqual({ ok: true, value: null })
  })

  it('accepts an allowed account with or without act_', () => {
    expect(resolveAccountParam('123', ALLOWED_ACCOUNTS)).toEqual({ ok: true, value: 'act_123' })
    expect(resolveAccountParam('act_456', ALLOWED_ACCOUNTS)).toEqual({ ok: true, value: 'act_456' })
  })

  it('forbids an account the person may not use', () => {
    expect(resolveAccountParam('act_789', ALLOWED_ACCOUNTS)).toEqual({ ok: false, status: 403 })
  })

  it('rejects an account id that is not digits', () => {
    expect(resolveAccountParam('act_12a', ALLOWED_ACCOUNTS)).toEqual({ ok: false, status: 400 })
    expect(resolveAccountParam('act_act_123', ALLOWED_ACCOUNTS)).toEqual({ ok: false, status: 400 })
  })
})

describe('isGraphId', () => {
  it('accepts digits only', () => {
    expect(isGraphId('120211234567890')).toBe(true)
    expect(isGraphId('')).toBe(false)
    expect(isGraphId('12a')).toBe(false)
    expect(isGraphId('act_123')).toBe(false)
    expect(isGraphId('1'.repeat(33))).toBe(false)
  })
})
