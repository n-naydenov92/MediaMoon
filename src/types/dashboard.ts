export interface DashboardKpis {
  readonly spend: number | null
  readonly revenue: number | null
  readonly roas: number | null
  readonly orders: number | null
  readonly aov: number | null
  readonly cpo: number | null
}

export interface DashboardKpiDeltas {
  readonly spend: number | null
  readonly revenue: number | null
  readonly roas: number | null
  readonly orders: number | null
  readonly aov: number | null
  readonly cpo: number | null
}

export interface DashboardDailyPoint {
  readonly date: string
  readonly spend: number | null
  readonly revenue: number | null
  readonly orders: number | null
}

export interface DashboardTopProduct {
  readonly productId: number
  readonly title: string
  readonly quantity: number
  readonly revenue: number
}

export interface DashboardSummary {
  readonly currency: 'EUR'
  readonly kpis: DashboardKpis
  readonly previous: DashboardKpis
  readonly deltas: DashboardKpiDeltas
  readonly byDay: readonly DashboardDailyPoint[]
  readonly topProducts: readonly DashboardTopProduct[]
  readonly fetchedAt: number
  readonly hasCommerce: boolean
}
