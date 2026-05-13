'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import type { BrandId } from '@/config/brands'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import {
  COMPARISON_LABELS,
  parseDateRangeFromQuery,
  type CustomRange,
  type DatePreset,
} from '@/lib/meta/dateRange'
import Notice from '../../Notice/Notice'
import DateRangeDropdown from '../../shared/DateRangeDropdown/DateRangeDropdown'
import KpiGrid from '../KpiGrid/KpiGrid'
import KpiSkeletonRows from '../KpiSkeletonRows/KpiSkeletonRows'
import OverviewContent from './OverviewContent/OverviewContent'
import PageHeader, { type Crumb } from '@/components/layout/PageHeader/PageHeader'
import UpdatedBadge from '@/components/layout/PageHeader/UpdatedBadge/UpdatedBadge'
import { useOverviewData } from '../useOverviewData'
import styles from './OverviewTab.module.css'

interface Props {
  readonly brandId: BrandId
}

const CRUMBS: readonly Crumb[] = [
  { label: 'Meta Ads' },
  { label: 'Overview' },
]

const CUSTOM_COMPARISON_LABEL = 'vs prev. period'

export default function OverviewTab({ brandId }: Props): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { selectedMarket } = useBrandShellContext()

  const dateSelection = useMemo(
    () => parseDateRangeFromQuery(searchParams),
    [searchParams],
  )
  const compareEnabled = searchParams.get('compare') !== 'off'

  const query = useMemo(
    () => ({ brandId, market: selectedMarket, dateSelection }),
    [brandId, selectedMarket, dateSelection],
  )
  const { state, refresh } = useOverviewData(query)
  const fetchedAt = state.status === 'success' ? state.data.fetchedAt : null

  const handlePresetChange = useCallback(
    (next: DatePreset) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('datePreset', next)
      params.delete('from')
      params.delete('to')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, pathname, searchParams],
  )

  const handleCustomRangeChange = useCallback(
    (range: CustomRange) => {
      const params = new URLSearchParams(searchParams.toString())
      params.delete('datePreset')
      params.set('from', range.from)
      params.set('to', range.to)
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

  const deltaLabel =
    dateSelection.kind === 'preset'
      ? COMPARISON_LABELS[dateSelection.preset]
      : CUSTOM_COMPARISON_LABEL

  const actions = (
    <>
      <UpdatedBadge
        fetchedAt={fetchedAt}
        onRefresh={refresh}
        disabled={state.status === 'loading'}
      />
      <DateRangeDropdown
        value={dateSelection}
        onPresetChange={handlePresetChange}
        onCustomRangeChange={handleCustomRangeChange}
        comparisonEnabled={compareEnabled}
        onComparisonChange={handleComparisonChange}
      />
    </>
  )

  return (
    <Box className={styles.root}>
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
          deltaLabel={deltaLabel}
          compareEnabled={compareEnabled}
        />
      )}

      {state.status === 'success' && (
        <OverviewContent
          summary={state.data}
          brandId={brandId}
          dateSelection={dateSelection}
          market={selectedMarket}
        />
      )}
    </Box>
  )
}
