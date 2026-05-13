'use client'

import { useCallback, useMemo, useState } from 'react'
import Stack from '@mui/material/Stack'
import type { BrandId } from '@/config/brands'
import { useBrandShellContext } from '@/contexts/brandShell/useBrandShellContext'
import type { CustomRange, DatePreset } from '@/lib/meta/dateRange'
import Notice from '../../Notice/Notice'
import DateRangeDropdown from '../../shared/DateRangeDropdown/DateRangeDropdown'
import KpiSkeletonRows from '../../overview/KpiSkeletonRows/KpiSkeletonRows'
import { PageHeader, UpdatedBadge, type Crumb } from '@/components/layout/PageHeader'
import AdsTable from '../AdsTable/AdsTable'
import AdvancedFilters from '../AdvancedFilters/AdvancedFilters'
import FilterChips, { type ChipKey } from '../FilterChips/FilterChips'
import LoadMore from '../LoadMore/LoadMore'
import Toolbar from '../Toolbar/Toolbar'
import type { ColumnId } from '../columnSpecs'
import type { FilterRule } from '../filterRules'
import { defaultCriteriaFor, sliceToFilters, type SortSpec } from '../sliceToFilters'
import { PERFORMANCE_PAGE_SIZE, useAdsList } from '../useAdsList'
import { useActiveChip } from '../useActiveChip'
import { useColumnVisibility } from '../useColumnVisibility'
import { useUrlSyncedQueryState } from '../useUrlSyncedQueryState'
import styles from './PerformanceTab.module.css'

interface Props {
  readonly brandId: BrandId
}

const CRUMBS: readonly Crumb[] = [
  { label: 'Meta Ads', href: '../overview' },
  { label: 'Performance' },
]

const NOOP_COMPARISON_CHANGE = (): void => {}

export default function PerformanceTab({ brandId }: Props): JSX.Element {
  const { selectedMarket } = useBrandShellContext()
  const { dateSelection, rules, sort, setDateSelection, setRules, setSort } =
    useUrlSyncedQueryState()
  const { visibleColumns, setVisibleColumns } = useColumnVisibility(brandId)
  const [addFilterOpen, setAddFilterOpen] = useState(false)
  const [debouncedNameQuery, setDebouncedNameQuery] = useState('')

  const presetForCriteria = dateSelection.kind === 'preset' ? dateSelection.preset : null
  const criteria = useMemo(() => defaultCriteriaFor(presetForCriteria), [presetForCriteria])
  const activeChip = useActiveChip(rules, sort, criteria)

  const query = useMemo(
    () => ({
      brandId,
      market: selectedMarket,
      dateSelection,
      filters: rules,
      sort,
      pageSize: PERFORMANCE_PAGE_SIZE,
    }),
    [brandId, selectedMarket, dateSelection, rules, sort],
  )
  const { state, refresh, loadMore } = useAdsList(query)

  const fetchedAt = state.status === 'success' ? state.data.fetchedAt : null

  const handlePresetChange = useCallback(
    (next: DatePreset) => {
      setDateSelection({ kind: 'preset', preset: next })
    },
    [setDateSelection],
  )

  const handleCustomRangeChange = useCallback(
    (range: CustomRange) => {
      setDateSelection({ kind: 'custom', range })
    },
    [setDateSelection],
  )

  const handleChipSelect = useCallback(
    (chip: ChipKey) => {
      const target: ChipKey = chip === activeChip ? 'all' : chip
      const preset = sliceToFilters(target === 'all' ? null : target, criteria)
      setRules(preset.filters)
      setSort(preset.sort)
    },
    [activeChip, criteria, setRules, setSort],
  )

  const handleAddRule = useCallback(
    (rule: FilterRule) => {
      setRules((prev) => [
        ...prev.filter((r) => !(r.field === rule.field && r.operator === rule.operator)),
        rule,
      ])
    },
    [setRules],
  )

  const handleRemoveRule = useCallback(
    (index: number) => {
      setRules((prev) => prev.filter((_, i) => i !== index))
    },
    [setRules],
  )

  const handleUpdateRule = useCallback(
    (index: number, rule: FilterRule) => {
      setRules((prev) => prev.map((r, i) => (i === index ? rule : r)))
    },
    [setRules],
  )

  const handleSortChange = useCallback(
    (next: SortSpec) => {
      setSort(next)
    },
    [setSort],
  )

  const handleColumnsChange = useCallback(
    (next: readonly ColumnId[]) => {
      setVisibleColumns(next)
    },
    [setVisibleColumns],
  )

  const handleOpenAddFilter = useCallback(() => setAddFilterOpen(true), [])
  const handleCloseAddFilter = useCallback(() => setAddFilterOpen(false), [])

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
        comparisonEnabled={false}
        onComparisonChange={NOOP_COMPARISON_CHANGE}
        comparisonDisabled
      />
    </>
  )

  const successData = state.status === 'success' ? state.data : null
  const loadingMore = state.status === 'success' ? state.loadingMore : false

  const visibleRows = useMemo(() => {
    if (!successData) {
      return []
    }
    const q = debouncedNameQuery.trim().toLowerCase()
    if (!q) {
      return successData.items
    }
    return successData.items.filter((row) => row.name.toLowerCase().includes(q))
  }, [successData, debouncedNameQuery])

  return (
    <Stack className={styles.root} spacing={2}>
      <PageHeader crumbs={CRUMBS} actions={actions} />

      <FilterChips
        activeChip={activeChip}
        onChipSelect={handleChipSelect}
        activeRules={rules}
        onUpdateRule={handleUpdateRule}
        onRemoveRule={handleRemoveRule}
        onOpenAddFilter={handleOpenAddFilter}
      />

      {state.status === 'success' && (
        <Toolbar
          total={successData?.total ?? 0}
          shown={visibleRows.length}
          sort={sort}
          onSortChange={handleSortChange}
          visibleColumns={visibleColumns}
          onColumnsChange={handleColumnsChange}
          onNameSearchChange={setDebouncedNameQuery}
        />
      )}

      {state.status === 'loading' && <KpiSkeletonRows />}

      {state.status === 'no-token' && (
        <Notice variant="info" title="Pending Meta token approval">
          Connection to this brand&apos;s Business Manager is not yet configured.
        </Notice>
      )}

      {state.status === 'error' && (
        <Notice variant="error" title="Couldn't load ads">
          {state.message}
        </Notice>
      )}

      {state.status === 'success' && successData && (
        <>
          <AdsTable
            rows={visibleRows}
            visibleColumns={visibleColumns}
            sort={sort}
            onSortChange={handleSortChange}
          />
          <LoadMore
            remaining={Math.max(0, successData.total - successData.items.length)}
            loading={loadingMore}
            onClick={loadMore}
          />
        </>
      )}

      <AdvancedFilters
        open={addFilterOpen}
        onClose={handleCloseAddFilter}
        onAdd={handleAddRule}
      />
    </Stack>
  )
}
