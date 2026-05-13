import type { MetaDailyPoint } from '@/types/dashboard'

export function roasOfDay(p: MetaDailyPoint): number {
  return p.spend > 0 ? p.revenue / p.spend : 0
}

export function cpoOfDay(p: MetaDailyPoint): number {
  return p.orders > 0 ? p.spend / p.orders : 0
}

export function checkoutRateOfDay(p: MetaDailyPoint): number {
  return p.checkoutsInitiated > 0 ? p.orders / p.checkoutsInitiated : 0
}
