'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import PageHeader from '@/components/layout/PageHeader/PageHeader'
import type { BrandId } from '@/config/brands'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import { ALL_MARKETS } from '@/lib/markets'
import {
  COMPARISON_LABELS,
  parseDateRangeFromQuery,
  type CustomRange,
  type DatePreset,
} from '@/lib/meta/dateRange'
import type { BrandConfig } from '@/types'
import type { DashboardSummary } from '@/types/dashboard'
import DashboardAnalytics from './DashboardAnalytics/DashboardAnalytics'
import DashboardChannelsBreakdown from './DashboardChannelsBreakdown/DashboardChannelsBreakdown'
import DashboardChart from '../DashboardChart/DashboardChart'
import DashboardHeaderActions from './DashboardHeaderActions/DashboardHeaderActions'
import DashboardKpiGrid from './DashboardKpiGrid/DashboardKpiGrid'
import DashboardProductsBreakdown from './DashboardProductsBreakdown/DashboardProductsBreakdown'
import DashboardSpendBreakdown from '../DashboardSpendBreakdown/DashboardSpendBreakdown'
import { buildDashboardCrumbs } from './dashboardCrumbs'
import KpiSkeletons from './KpiSkeletons/KpiSkeletons'
import { isSingleDayRange } from './helpers'
import styles from './DashboardOverview.module.css'

interface Props {
  readonly brand: BrandConfig & { readonly id: BrandId }
}

type DashboardState =
  | { readonly status: 'loading' }
  | { readonly status: 'success'; readonly data: DashboardSummary }
  | { readonly status: 'error'; readonly message: string }

const CUSTOM_COMPARISON_LABEL = 'vs prev. period'

export default function DashboardOverview({ brand }: Props): JSX.Element {
  const { selectedMarket } = useBrandShellContext()
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
    const cacheKey = `${brand.id}|${selectedMarket}|${dateKey}`
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
    if (selectedMarket !== ALL_MARKETS) {
      params.set('market', selectedMarket)
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
  }, [brand.id, dateKey, dateSelection, refreshTick, selectedMarket])

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
    <DashboardHeaderActions
      fetchedAt={fetchedAt}
      isLoading={state.status === 'loading'}
      onRefresh={handleRefresh}
      dateSelection={dateSelection}
      comparisonEnabled={compareEnabled}
      onPresetChange={handlePresetChange}
      onCustomRangeChange={handleCustomRangeChange}
      onComparisonChange={handleComparisonChange}
    />
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

      <Typography component="h2" variant="h2" className={styles.sectionHeading}>
        Brand Overview
      </Typography>

      <Box className={styles.chartRow}>
        <Box className={styles.chartCol}>
          {state.status === 'success' ? (
            <DashboardChart
              data={state.data.byDay}
              hasCommerce={state.data.hasCommerce}
              hasAnalytics={state.data.hasAnalytics}
            />
          ) : (
            <Skeleton variant="rounded" height={320} className={styles.chartSkeleton} />
          )}
        </Box>
        <Box className={styles.breakdownCol}>
          {state.status === 'success' ? (
            <DashboardSpendBreakdown breakdown={state.data.spendBreakdown} />
          ) : (
            <Skeleton variant="rounded" height={320} className={styles.chartSkeleton} />
          )}
        </Box>
      </Box>

      <Typography component="h2" variant="h2" className={styles.sectionHeading}>
        Channels Breakdown
      </Typography>
      {state.status === 'success' ? (
        <DashboardChannelsBreakdown
          channels={state.data.channels}
          previousChannels={state.data.previousChannels}
          channelsByDay={state.data.channelsByDay}
          spendBreakdown={state.data.spendBreakdown}
          comparisonEnabled={compareEnabled}
          showSparklines={!isSingleDayRange(dateSelection)}
          deltaLabel={deltaLabel}
        />
      ) : (
        <Skeleton variant="rounded" height={480} className={styles.chartSkeleton} />
      )}

      <Typography component="h2" variant="h2" className={styles.sectionHeading}>
        Analytics
      </Typography>
      {state.status === 'success' ? (
        <DashboardAnalytics
          analytics={state.data.analytics}
          previousAnalytics={state.data.previousAnalytics}
          kpis={state.data.kpis}
          previousKpis={state.data.previous}
          byDay={state.data.byDay}
          comparisonEnabled={compareEnabled}
          showSparklines={!isSingleDayRange(dateSelection)}
          deltaLabel={deltaLabel}
        />
      ) : (
        <Skeleton variant="rounded" height={420} className={styles.chartSkeleton} />
      )}

      <Typography component="h2" variant="h2" className={styles.sectionHeading}>
        Products Breakdown
      </Typography>
      <DashboardProductsBreakdown
        products={state.status === 'success' ? state.data.topProducts : []}
        categories={state.status === 'success' ? state.data.categories ?? [] : []}
        storeAov={state.status === 'success' ? state.data.kpis.aov : null}
        hasCommerce={state.status === 'success' ? state.data.hasCommerce : true}
        loading={state.status === 'loading'}
      />
    </Stack>
  )
}
