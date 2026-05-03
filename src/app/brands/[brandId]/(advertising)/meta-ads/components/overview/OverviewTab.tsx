'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { BrandId } from '@/config/brands'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import {
  DEFAULT_DATE_PRESET,
  isDatePreset,
  type DatePreset,
} from '@/lib/meta/dateRange'
import Notice from '../Notice'
import Section from '../shared/Section'
import DateRangeDropdown from '../shared/DateRangeDropdown'
import KpiGrid from './KpiGrid'
import SpendChart from './SpendChart'
import AccountBreakdown from './AccountBreakdown'
import Leaderboards from './Leaderboards'
import { useOverviewData, type OverviewSummary } from './useOverviewData'
import styles from './OverviewTab.module.css'

interface Props {
  readonly brandId: BrandId
}

export default function OverviewTab({ brandId }: Props): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { selectedMarket } = useBrandShellContext()

  const datePresetRaw = searchParams.get('datePreset')
  const datePreset: DatePreset =
    datePresetRaw && isDatePreset(datePresetRaw) ? datePresetRaw : DEFAULT_DATE_PRESET

  const query = useMemo(
    () => ({ brandId, market: selectedMarket, datePreset }),
    [brandId, selectedMarket, datePreset],
  )
  const state = useOverviewData(query)

  const handleDatePresetChange = useCallback(
    (next: DatePreset) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('datePreset', next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.heading}>Overview</h1>
        <DateRangeDropdown value={datePreset} onChange={handleDatePresetChange} />
      </header>

      {state.status === 'loading' && <OverviewSkeleton />}

      {state.status === 'no-token' && (
        <Notice variant="info" title="Pending Meta token approval">
          Connection to this brand&apos;s Business Manager is not yet configured.
        </Notice>
      )}

      {state.status === 'error' && (
        <Notice variant="error" title="Couldn't load overview">
          {state.message}
        </Notice>
      )}

      {state.status === 'success' && <OverviewContent summary={state.data} />}
    </div>
  )
}

function OverviewContent({ summary }: { readonly summary: OverviewSummary }): JSX.Element {
  const hasAnyData = summary.byAccount.length > 0 || summary.byDay.length > 0
  if (!hasAnyData) {
    return (
      <Notice variant="info" title="No data yet">
        No spend recorded for this brand in the selected range.
      </Notice>
    )
  }
  return (
    <>
      <KpiGrid kpis={summary.kpis} />

      <div className={styles.midGrid}>
        <Section title="Spend vs Revenue" className={styles.spendSection}>
          <SpendChart data={summary.byDay} />
        </Section>
        <Section title="Performance by ad account" className={styles.accountSection}>
          <AccountBreakdown accounts={summary.byAccount} />
        </Section>
      </div>

      <Leaderboards summary={summary} />
    </>
  )
}

const SKELETON_TILE_KEYS = ['a', 'b', 'c', 'd'] as const

function OverviewSkeleton(): JSX.Element {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonRow}>
        {SKELETON_TILE_KEYS.map((k) => (
          <div key={`top-${k}`} className={styles.skeletonTile} />
        ))}
      </div>
      <div className={styles.skeletonRow}>
        {SKELETON_TILE_KEYS.map((k) => (
          <div key={`bot-${k}`} className={styles.skeletonTile} />
        ))}
      </div>
      <div className={styles.skeletonChartRow}>
        <div className={styles.skeletonChart} />
        <div className={styles.skeletonAccount} />
      </div>
      <div className={styles.skeletonRow}>
        {SKELETON_TILE_KEYS.map((k) => (
          <div key={`lb-${k}`} className={styles.skeletonLeaderboard} />
        ))}
      </div>
    </div>
  )
}
