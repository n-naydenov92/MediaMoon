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
import DateRangeDropdown from '../shared/DateRangeDropdown'
import KpiGrid from './KpiGrid'
import KpiSkeletonRows from './KpiSkeletonRows'
import OverviewContent from './OverviewContent'
import PageHeader, { type Crumb } from './PageHeader'
import UpdatedBadge from './UpdatedBadge'
import { useOverviewData } from './useOverviewData'
import styles from './OverviewTab.module.css'

interface Props {
  readonly brandId: BrandId
}

const CRUMBS: readonly Crumb[] = [
  { label: 'Meta Ads' },
  { label: 'Overview' },
]

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
      <PageHeader crumbs={CRUMBS} actions={actions} />

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
        <OverviewContent
          summary={state.data}
          brandId={brandId}
          datePreset={datePreset}
          market={selectedMarket}
        />
      )}
    </div>
  )
}
