'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { BrandId } from '@/config/brands'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import {
  COMPARISON_LABELS,
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
import UpdatedBadge from './UpdatedBadge'
import PageHeader, { type Crumb } from './PageHeader'
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
  const compareEnabled = searchParams.get('compare') !== 'off'

  const query = useMemo(
    () => ({ brandId, market: selectedMarket, datePreset }),
    [brandId, selectedMarket, datePreset],
  )
  const { state, refresh } = useOverviewData(query)
  const fetchedAt = state.status === 'success' ? state.data.fetchedAt : null

  const handleDatePresetChange = useCallback(
    (next: DatePreset) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('datePreset', next)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const handleComparisonChange = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) {
        params.delete('compare')
      } else {
        params.set('compare', 'off')
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const crumbs: readonly Crumb[] = [
    { label: 'Meta Ads' },
    { label: 'Overview' },
  ]

  const actions = (
    <>
      <UpdatedBadge
        fetchedAt={fetchedAt}
        onRefresh={refresh}
        disabled={state.status === 'loading'}
      />
      <DateRangeDropdown
        value={datePreset}
        onChange={handleDatePresetChange}
        comparisonEnabled={compareEnabled}
        onComparisonChange={handleComparisonChange}
      />
    </>
  )

  return (
    <div className={styles.root}>
      <PageHeader crumbs={crumbs} actions={actions} />

      {state.status === 'loading' && <KpiSkeletonRows />}
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
      {state.status === 'success' && (
        <KpiGrid
          kpis={state.data.kpis}
          byDay={state.data.byDay}
          deltaLabel={COMPARISON_LABELS[datePreset]}
          compareEnabled={compareEnabled}
        />
      )}

      {state.status === 'success' && (
        <OverviewContent summary={state.data} />
      )}
    </div>
  )
}

function OverviewContent({ summary }: { readonly summary: OverviewSummary }): JSX.Element | null {
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
      <Section title="Accounts Highlights" bare>
        <div className={styles.midGrid}>
          <Section title="Performance" className={styles.spendSection}>
            <SpendChart data={summary.byDay} />
          </Section>
          <Section title="Accounts Breakdown" className={styles.accountSection}>
            <AccountBreakdown accounts={summary.byAccount} />
          </Section>
        </div>
      </Section>
      <Section title="Ads Highlights" bare>
        <Leaderboards summary={summary} />
      </Section>
    </>
  )
}

const KPI_SKELETON_KEYS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const

function KpiSkeletonRows(): JSX.Element {
  return (
    <div className={styles.skeletonGrid}>
      {KPI_SKELETON_KEYS.map((k) => (
        <div key={k} className={styles.skeletonTile} />
      ))}
    </div>
  )
}
