import { formatCompactNumber, formatEur, formatPercentage, formatRoas } from '@/lib/meta/fx'

export const COLUMN_IDS = [
  'spend',
  'revenue',
  'roas',
  'purchases',
  'cpp',
  'ctr',
  'lpv',
  'cplpv',
  'atc',
  'cpatc',
  'ic',
  'cpic',
  'cpm',
  'cpc',
  'impressions',
  'clicks',
] as const

export type ColumnId = typeof COLUMN_IDS[number]

export interface AdRow {
  readonly adId: string
  readonly name: string
  readonly status: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly accountName: string
  readonly spend: number
  readonly revenue: number
  readonly roas: number
  readonly purchases: number
  readonly cpp: number
  readonly ctr: number
  readonly cpm: number
  readonly cpc: number
  readonly impressions: number
  readonly clicks: number
  readonly lpv: number
  readonly cplpv: number
  readonly atc: number
  readonly cpatc: number
  readonly ic: number
  readonly cpic: number
}

export interface ColumnSpec {
  readonly id: ColumnId
  readonly label: string
  readonly shortLabel: string
  readonly help: string
  readonly format: (row: AdRow) => string
  readonly numericValue: (row: AdRow) => number
  readonly defaultVisible: boolean
}

const COLUMN_DEFS: Record<ColumnId, ColumnSpec> = {
  spend: {
    id: 'spend',
    label: 'Spend',
    shortLabel: 'Spend',
    help: 'Amount spent',
    format: (r) => formatEur(r.spend),
    numericValue: (r) => r.spend,
    defaultVisible: true,
  },
  revenue: {
    id: 'revenue',
    label: 'Revenue',
    shortLabel: 'Rev',
    help: 'Purchase conversion value',
    format: (r) => formatEur(r.revenue),
    numericValue: (r) => r.revenue,
    defaultVisible: true,
  },
  roas: {
    id: 'roas',
    label: 'ROAS',
    shortLabel: 'ROAS',
    help: 'Return on ad spend',
    format: (r) => formatRoas(r.roas),
    numericValue: (r) => r.roas,
    defaultVisible: true,
  },
  purchases: {
    id: 'purchases',
    label: 'Purchases',
    shortLabel: 'Purch.',
    help: 'Number of purchases',
    format: (r) => formatCompactNumber(r.purchases),
    numericValue: (r) => r.purchases,
    defaultVisible: true,
  },
  cpp: {
    id: 'cpp',
    label: 'CPP',
    shortLabel: 'CPP',
    help: 'Cost per purchase',
    format: (r) => (r.cpp > 0 ? formatEur(r.cpp) : '—'),
    numericValue: (r) => r.cpp,
    defaultVisible: true,
  },
  ctr: {
    id: 'ctr',
    label: 'Link CTR',
    shortLabel: 'CTR',
    help: 'Link click-through rate',
    format: (r) => formatPercentage(r.ctr, 2),
    numericValue: (r) => r.ctr,
    defaultVisible: true,
  },
  lpv: {
    id: 'lpv',
    label: 'Landing page views',
    shortLabel: 'LPV',
    help: 'Landing page views',
    format: (r) => formatCompactNumber(r.lpv),
    numericValue: (r) => r.lpv,
    defaultVisible: true,
  },
  cplpv: {
    id: 'cplpv',
    label: 'Cost per LPV',
    shortLabel: 'CPLPV',
    help: 'Cost per landing page view',
    format: (r) => (r.cplpv > 0 ? formatEur(r.cplpv) : '—'),
    numericValue: (r) => r.cplpv,
    defaultVisible: true,
  },
  atc: {
    id: 'atc',
    label: 'Adds to cart',
    shortLabel: 'ATC',
    help: 'Adds to cart',
    format: (r) => formatCompactNumber(r.atc),
    numericValue: (r) => r.atc,
    defaultVisible: false,
  },
  cpatc: {
    id: 'cpatc',
    label: 'Cost per ATC',
    shortLabel: 'CPATC',
    help: 'Cost per add to cart',
    format: (r) => (r.cpatc > 0 ? formatEur(r.cpatc) : '—'),
    numericValue: (r) => r.cpatc,
    defaultVisible: false,
  },
  ic: {
    id: 'ic',
    label: 'Initiated checkout',
    shortLabel: 'IC',
    help: 'Checkouts initiated',
    format: (r) => formatCompactNumber(r.ic),
    numericValue: (r) => r.ic,
    defaultVisible: false,
  },
  cpic: {
    id: 'cpic',
    label: 'Cost per IC',
    shortLabel: 'CPIC',
    help: 'Cost per initiated checkout',
    format: (r) => (r.cpic > 0 ? formatEur(r.cpic) : '—'),
    numericValue: (r) => r.cpic,
    defaultVisible: false,
  },
  cpm: {
    id: 'cpm',
    label: 'CPM',
    shortLabel: 'CPM',
    help: 'Cost per 1,000 impressions',
    format: (r) => (r.cpm > 0 ? formatEur(r.cpm) : '—'),
    numericValue: (r) => r.cpm,
    defaultVisible: false,
  },
  cpc: {
    id: 'cpc',
    label: 'CPC',
    shortLabel: 'CPC',
    help: 'Cost per link click',
    format: (r) => (r.cpc > 0 ? formatEur(r.cpc) : '—'),
    numericValue: (r) => r.cpc,
    defaultVisible: false,
  },
  impressions: {
    id: 'impressions',
    label: 'Impressions',
    shortLabel: 'Impr.',
    help: 'Impressions',
    format: (r) => formatCompactNumber(r.impressions),
    numericValue: (r) => r.impressions,
    defaultVisible: false,
  },
  clicks: {
    id: 'clicks',
    label: 'Link clicks',
    shortLabel: 'Clicks',
    help: 'Link clicks',
    format: (r) => formatCompactNumber(r.clicks),
    numericValue: (r) => r.clicks,
    defaultVisible: false,
  },
}

export function getColumnSpec(id: ColumnId): ColumnSpec {
  return COLUMN_DEFS[id]
}

export function isColumnId(value: string): value is ColumnId {
  return (COLUMN_IDS as readonly string[]).includes(value)
}

export const DEFAULT_COLUMN_IDS: readonly ColumnId[] = COLUMN_IDS.filter(
  (id) => COLUMN_DEFS[id].defaultVisible,
)

export function parseColumnIds(raw: string | null): readonly ColumnId[] {
  if (!raw) {
    return DEFAULT_COLUMN_IDS
  }
  const requested = raw.split(',').filter(isColumnId)
  return requested.length > 0 ? requested : DEFAULT_COLUMN_IDS
}

export function stringifyColumnIds(ids: readonly ColumnId[]): string {
  return ids.join(',')
}
