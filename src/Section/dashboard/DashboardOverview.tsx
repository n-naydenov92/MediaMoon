'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import DateRangeDropdown from '@/app/brands/[brandId]/(advertising)/meta-ads/components/shared/DateRangeDropdown'
import { PageHeader, UpdatedBadge } from '@/components/layout/PageHeader'
import type { BrandId } from '@/config/brands'
import {
  COMPARISON_LABELS,
  parseDateRangeFromQuery,
  type CustomRange,
  type DatePreset,
} from '@/lib/meta/dateRange'
import type { BrandConfig } from '@/types'
import type { DashboardSummary } from '@/types/dashboard'
import DashboardChart from './DashboardChart'
import DashboardKpiGrid from './DashboardKpiGrid'
import DashboardTopProducts from './DashboardTopProducts'
import { buildDashboardCrumbs } from './dashboardCrumbs'
import styles from './DashboardOverview.module.css'

interface Props {
  readonly brand: BrandConfig & { readonly id: BrandId }
}

type DashboardState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: DashboardSummary }
  | { readonly status: 'error'; readonly message: string }

const CUSTOM_COMPARISON_LABEL = 'vs prev. period'
const SKELETON_KPI_COUNT = 6

export default function DashboardOverview({ brand }: Props): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const dateSelection = useMemo(
    () => parseDateRangeFromQuery(searchParams),
    [searchParams],
  )
  const compareEnabled = searchParams.get('compare') !== 'off'
  const dateKey =
    dateSelection.kind === 'preset'
      ? `p:${dateSelection.preset}`
      : `c:${dateSelection.range.from}:${dateSelection.range.to}`

  const [refreshTick, setRefreshTick] = useState(0)
  const [state, setState] = useState<DashboardState>({ status: 'loading' })
  const cacheRef = useRef<Map<string, DashboardSummary>>(new Map())

  useEffect(() => {
    const controller = new AbortController()
    const cacheKey = `${brand.id}|${dateKey}`
    const cached = refreshTick === 0 ? cacheRef.current.get(cacheKey) : undefined

    if (cached) {
      setState({ status: 'success', data: cached })
    } else {
      setState({ status: 'loading' })
    }

    const params = new URLSearchParams({ brandId: brand.id })
    if (dateSelection.kind === 'preset') {
      params.set('datePreset', dateSelection.preset)
    } else {
      params.set('from', dateSelection.range.from)
      params.set('to', dateSelection.range.to)
    }
    if (refreshTick > 0) {
      params.set('refresh', 'true')
    }

    void (async () => {
      try {
        const response = await fetch(`/api/brands/dashboard/summary?${params.toString()}`, {
          signal: controller.signal,
          cache: refreshTick > 0 ? 'reload' : 'default',
        })
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string }
          setState({ status: 'error', message: body.error ?? `HTTP ${response.status}` })
          return
        }
        const data = (await response.json()) as DashboardSummary
        cacheRef.current.set(cacheKey, data)
        setState({ status: 'success', data })
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return
        }
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
      }
    })()

    return () => controller.abort()
  }, [brand.id, dateKey, dateSelection, refreshTick])

  const handleRefresh = useCallback(() => {
    setRefreshTick((n) => n + 1)
  }, [])

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

  const fetchedAt = state.status === 'success' ? state.data.fetchedAt : null
  const deltaLabel =
    dateSelection.kind === 'preset'
      ? COMPARISON_LABELS[dateSelection.preset]
      : CUSTOM_COMPARISON_LABEL

  const crumbs = useMemo(() => buildDashboardCrumbs(brand.label), [brand.label])

  const actions = (
    <>
      <UpdatedBadge
        fetchedAt={fetchedAt}
        onRefresh={handleRefresh}
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
    <Stack className={styles.root} gap={4}>
      <PageHeader crumbs={crumbs} actions={actions} />

      {state.status === 'error' && (
        <Alert severity="error" variant="outlined" className={styles.error}>
          Couldn&apos;t load dashboard data. {state.message}
        </Alert>
      )}

      {state.status === 'loading' && <KpiSkeletons />}
      {state.status === 'success' && (
        <DashboardKpiGrid
          kpis={state.data.kpis}
          deltas={state.data.deltas}
          byDay={state.data.byDay}
          deltaLabel={deltaLabel}
          comparisonEnabled={compareEnabled}
          showSparklines={!isSingleDayRange(dateSelection)}
        />
      )}

      {!isSingleDayRange(dateSelection) &&
        (state.status === 'success' ? (
          <DashboardChart data={state.data.byDay} hasCommerce={state.data.hasCommerce} />
        ) : (
          <Skeleton variant="rounded" height={320} className={styles.chartSkeleton} />
        ))}

      <DashboardTopProducts
        products={state.status === 'success' ? state.data.topProducts : []}
        hasCommerce={state.status === 'success' ? state.data.hasCommerce : true}
        loading={state.status === 'loading'}
      />
    </Stack>
  )
}

function isSingleDayRange(selection: ReturnType<typeof parseDateRangeFromQuery>): boolean {
  if (selection.kind === 'preset') {
    return selection.preset === 'today' || selection.preset === 'yesterday'
  }
  return selection.range.from === selection.range.to
}

function KpiSkeletons(): JSX.Element {
  return (
    <Box className={styles.skeletonGrid}>
      {Array.from({ length: SKELETON_KPI_COUNT }).map((_, i) => (
        <Skeleton key={i} variant="rounded" height={108} />
      ))}
    </Box>
  )
}
