import type { AggregatedKpis, DailyPoint } from '@/lib/meta/aggregate'
import { formatCompactNumber, formatEur, formatPercentage, formatRoas } from '@/lib/meta/fx'

export interface KpiTileSpec {
  readonly key: string
  readonly label: string
  readonly format: (kpis: AggregatedKpis) => string
  readonly read: (kpis: AggregatedKpis) => number
  readonly readDaily?: (point: DailyPoint) => number
  readonly formatDaily?: (value: number) => string
}

export const KPI_TILE_SPECS: readonly KpiTileSpec[] = [
  {
    key: 'spend',
    label: 'Spend',
    format: (k) => formatEur(k.spendEur),
    read: (k) => k.spendEur,
    readDaily: (p) => p.spendEur,
    formatDaily: (v) => formatEur(v),
  },
  {
    key: 'revenue',
    label: 'Revenue',
    format: (k) => formatEur(k.revenueEur),
    read: (k) => k.revenueEur,
    readDaily: (p) => p.revenueEur,
    formatDaily: (v) => formatEur(v),
  },
  {
    key: 'roas',
    label: 'ROAS',
    format: (k) => formatRoas(k.roas),
    read: (k) => k.roas,
    readDaily: (p) => (p.spendEur > 0 ? p.revenueEur / p.spendEur : 0),
    formatDaily: (v) => formatRoas(v),
  },
  {
    key: 'purchases',
    label: 'Purchases',
    format: (k) => formatCompactNumber(k.purchases),
    read: (k) => k.purchases,
    readDaily: (p) => p.purchases,
    formatDaily: (v) => formatCompactNumber(v),
  },
  {
    key: 'linkCtr',
    label: 'Link CTR',
    format: (k) => formatPercentage(k.linkCtr),
    read: (k) => k.linkCtr,
  },
  {
    key: 'costPerLpv',
    label: 'Cost / LPV',
    format: (k) => formatEur(k.costPerLpvEur),
    read: (k) => k.costPerLpvEur,
  },
  {
    key: 'addsToCart',
    label: 'Adds to Cart',
    format: (k) => formatCompactNumber(k.addsToCart),
    read: (k) => k.addsToCart,
  },
  {
    key: 'checkoutsInitiated',
    label: 'Checkouts Initiated',
    format: (k) => formatCompactNumber(k.checkoutsInitiated),
    read: (k) => k.checkoutsInitiated,
  },
]
