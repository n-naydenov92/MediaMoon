import type { GoogleAdsDailyPoint } from '@/types/dashboard'

export function roasOfDay(p: GoogleAdsDailyPoint): number {
  return p.spend > 0 ? p.revenue / p.spend : 0
}

export function cpoOfDay(p: GoogleAdsDailyPoint): number {
  return p.orders > 0 ? p.spend / p.orders : 0
}

export function costPerVisitorOfDay(p: GoogleAdsDailyPoint): number {
  return p.clicks > 0 ? p.spend / p.clicks : 0
}
