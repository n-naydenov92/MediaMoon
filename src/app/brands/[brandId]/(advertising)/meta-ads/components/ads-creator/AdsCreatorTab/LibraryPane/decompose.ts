import type { AdMetrics } from '@/lib/meta/metricThresholds'
import type { AssetCreative } from '../assetCreative'

// Mirrors the /api/meta-ads/elements row shape. Raw additive metrics only — ratios
// are derived here so they stay correct after de-duplication across ads.
export interface AdElementRow {
  readonly adId: string
  readonly name: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly accountId: string
  readonly accountName: string
  readonly bodies: readonly string[]
  readonly titles: readonly string[]
  readonly urls: readonly string[]
  readonly imageHash: string | null
  readonly imageUrl: string | null
  readonly videoId: string | null
  readonly spend: number
  readonly revenue: number
  readonly impressions: number
  readonly purchases: number
  readonly linkClicks: number
  readonly lpv: number
}

export interface ElementsPayload {
  readonly items: readonly AdElementRow[]
  readonly nextOffset: number | null
  readonly fetchedAt: number
}

export interface ElementMetrics extends AdMetrics {
  readonly spend: number
  readonly revenue: number
  readonly impressions: number
  readonly purchases: number
}

export interface CreativeElement {
  readonly key: string
  readonly adId: string
  readonly accountId: string
  readonly creativeType: 'image' | 'video' | 'unknown'
  readonly thumbnailUrl: string | null
  readonly imageHash: string | null
  readonly imageUrl: string | null
  readonly videoId: string | null
  readonly label: string
  readonly usedInAds: number
  readonly metrics: ElementMetrics
}

export interface TextElement {
  readonly key: string
  readonly text: string
  readonly usedInAds: number
  readonly metrics: ElementMetrics
}

interface RawTotals {
  spend: number
  revenue: number
  impressions: number
  purchases: number
  linkClicks: number
  lpv: number
}

function emptyTotals(): RawTotals {
  return { spend: 0, revenue: 0, impressions: 0, purchases: 0, linkClicks: 0, lpv: 0 }
}

function addRow(acc: RawTotals, row: AdElementRow): void {
  acc.spend += row.spend
  acc.revenue += row.revenue
  acc.impressions += row.impressions
  acc.purchases += row.purchases
  acc.linkClicks += row.linkClicks
  acc.lpv += row.lpv
}

function toMetrics(t: RawTotals): ElementMetrics {
  return {
    spend: t.spend,
    revenue: t.revenue,
    impressions: t.impressions,
    purchases: t.purchases,
    roas: t.spend > 0 ? t.revenue / t.spend : 0,
    cpp: t.purchases > 0 ? t.spend / t.purchases : 0,
    ctr: t.impressions > 0 ? t.linkClicks / t.impressions : 0,
    cplpv: t.lpv > 0 ? t.spend / t.lpv : 0,
  }
}

// One creative per distinct asset (image hash / video id), falling back to the ad
// id when neither is present. Metrics are summed across every ad reusing it.
interface CreativeAccum {
  first: AdElementRow
  thumbRow: AdElementRow | null
  count: number
  totals: RawTotals
}

export function toCreativeElements(rows: readonly AdElementRow[]): readonly CreativeElement[] {
  const byKey = new Map<string, CreativeAccum>()
  for (const row of rows) {
    const key = row.imageHash ?? row.videoId ?? row.adId
    const existing = byKey.get(key)
    if (existing) {
      addRow(existing.totals, row)
      existing.count += 1
      if (!existing.thumbRow && row.thumbnailUrl) {
        existing.thumbRow = row
      }
      continue
    }
    const totals = emptyTotals()
    addRow(totals, row)
    byKey.set(key, { first: row, thumbRow: row.thumbnailUrl ? row : null, count: 1, totals })
  }
  return [...byKey.entries()].map(([key, entry]) => {
    const display = entry.thumbRow ?? entry.first
    return {
      key,
      adId: display.adId,
      accountId: display.accountId,
      creativeType: display.creativeType,
      thumbnailUrl: display.thumbnailUrl,
      imageHash: display.imageHash,
      imageUrl: display.imageUrl,
      videoId: display.videoId,
      label: display.name,
      usedInAds: entry.count,
      metrics: toMetrics(entry.totals),
    }
  })
}

// One text element per distinct (trimmed) value, with metrics summed across every
// ad that uses it. `select` picks which strings on a row to aggregate.
function aggregateByText(
  rows: readonly AdElementRow[],
  select: (row: AdElementRow) => readonly string[],
): readonly TextElement[] {
  const byText = new Map<string, { totals: RawTotals; ads: number }>()
  for (const row of rows) {
    for (const text of select(row)) {
      const entry = byText.get(text) ?? { totals: emptyTotals(), ads: 0 }
      addRow(entry.totals, row)
      entry.ads += 1
      byText.set(text, entry)
    }
  }
  return [...byText.entries()].map(([text, entry]) => ({
    key: text,
    text,
    usedInAds: entry.ads,
    metrics: toMetrics(entry.totals),
  }))
}

export function toTextElements(
  rows: readonly AdElementRow[],
  kind: 'primary' | 'headline',
): readonly TextElement[] {
  return aggregateByText(rows, (row) => (kind === 'primary' ? row.bodies : row.titles))
}

export function toUrlElements(rows: readonly AdElementRow[]): readonly TextElement[] {
  return aggregateByText(rows, (row) => row.urls)
}

// Builds the queue-able asset from a library creative, or null when it lacks
// re-uploadable source media (no full image URL, or a video without a thumbnail).
export function creativeToAsset(c: CreativeElement): AssetCreative | null {
  if (c.creativeType === 'video') {
    if (!c.videoId || !c.thumbnailUrl) {
      return null
    }
    return {
      assetKey: c.videoId,
      mediaType: 'video',
      imageUrl: null,
      videoId: c.videoId,
      thumbnailUrl: c.thumbnailUrl,
      name: c.label,
    }
  }
  if (!c.imageUrl) {
    return null
  }
  return {
    assetKey: c.imageHash ?? c.imageUrl,
    mediaType: 'image',
    imageUrl: c.imageUrl,
    videoId: null,
    thumbnailUrl: c.thumbnailUrl,
    name: c.label,
  }
}
