import { describe, expect, it } from 'vitest'
import { isModuleEnabled } from './modules'

describe('isModuleEnabled', () => {
  it('always has the dashboard', () => {
    expect(isModuleEnabled('dashboard', [])).toBe(true)
  })

  it('has Meta Ads only with a Meta integration', () => {
    expect(isModuleEnabled('meta-ads', ['META'])).toBe(true)
    expect(isModuleEnabled('meta-ads', ['GOOGLE_ADS', 'WOOCOMMERCE'])).toBe(false)
  })

  it('has Google Ads only with a Google Ads integration', () => {
    expect(isModuleEnabled('google-ads', ['GOOGLE_ADS'])).toBe(true)
    expect(isModuleEnabled('google-ads', ['META'])).toBe(false)
  })
})
