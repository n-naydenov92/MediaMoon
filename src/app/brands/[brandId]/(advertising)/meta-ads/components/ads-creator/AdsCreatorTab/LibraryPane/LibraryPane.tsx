'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import type { BrandId } from '@/config/brands'
import type { MarketSelection } from '@/lib/markets'
import type { CustomRange, DatePreset, DateRangeSelection } from '@/lib/meta/dateRange'
import CenteredSpinner from '@/components/ui/CenteredSpinner/CenteredSpinner'
import EmptyState from '@/components/ui/EmptyState/EmptyState'
import ErrorPanel from '@/components/ui/ErrorPanel/ErrorPanel'
import UpdatedBadge from '@/components/layout/PageHeader/UpdatedBadge/UpdatedBadge'
import { hasTextVariation, isVariationListFull } from '../CopyForm/VariationList/helpers'
import type { AssetCreative } from '../assetCreative'
import DateRangeDropdown from '../../../shared/DateRangeDropdown/DateRangeDropdown'
import AdvancedFilters from '../../../shared/filters/AdvancedFilters/AdvancedFilters'
import CreativeCard from './CreativeCard/CreativeCard'
import ElementFilterChips from './ElementFilterChips/ElementFilterChips'
import ElementToolbar from './ElementToolbar/ElementToolbar'
import TextElementRow from './TextElementRow/TextElementRow'
import {
  ELEMENT_LIBRARY_DATE_PRESET,
  ELEMENT_TABS,
  INITIAL_VISIBLE,
  VISIBLE_STEP,
  filterFieldsFor,
  getTabDef,
  type ElementTabId,
} from './config'
import {
  creativeMatchesRules,
  matchesSearch,
  rankElements,
  tabKind,
  textMatchesRules,
} from './helpers'
import {
  creativeToAsset,
  toCreativeElements,
  toTextElements,
  toUrlElements,
  type AdElementRow,
} from './decompose'
import { useElementLibrary } from './useElementLibrary'
import { useLibraryFilters } from './useLibraryFilters'
import { useLibrarySort } from './useLibrarySort'
import styles from './LibraryPane.module.css'

const NO_SOURCE_REASON = 'No re-usable source media for this creative'
const NOOP = (): void => { }
const EMPTY_ROWS: readonly AdElementRow[] = []

const NOUN_BY_KIND: Record<'creative' | 'primary' | 'headline' | 'url', string> = {
  creative: 'creatives',
  primary: 'texts',
  headline: 'headlines',
  url: 'URLs',
}

const SEARCH_PLACEHOLDER_BY_KIND: Record<'creative' | 'primary' | 'headline' | 'url', string> = {
  creative: 'Search creatives…',
  primary: 'Search text…',
  headline: 'Search headlines…',
  url: 'Search URLs…',
}

const NOOP_COMPARISON = (): void => { }

interface Props {
  readonly brandId: BrandId
  readonly market: MarketSelection
  readonly primaryTexts: readonly string[]
  readonly headlines: readonly string[]
  readonly url: string
  readonly addedAssetKeys: ReadonlySet<string>
  readonly onAddPrimaryText: (value: string) => void
  readonly onAddHeadline: (value: string) => void
  readonly onAddUrl: (value: string) => void
  readonly onAddCreative: (asset: AssetCreative) => void
}

export default memo(function LibraryPane({
  brandId,
  market,
  primaryTexts,
  headlines,
  url,
  addedAssetKeys,
  onAddPrimaryText,
  onAddHeadline,
  onAddUrl,
  onAddCreative,
}: Props): JSX.Element {
  const [dateSelection, setDateSelection] = useState<DateRangeSelection>({
    kind: 'preset',
    preset: ELEMENT_LIBRARY_DATE_PRESET,
  })
  const [activeTab, setActiveTab] = useState<ElementTabId>('creatives')
  const [search, setSearch] = useState('')
  const [addFilterOpen, setAddFilterOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  const tabDef = getTabDef(activeTab)
  const sort = useLibrarySort(activeTab)
  const filters = useLibraryFilters(activeTab, tabDef.presets)

  const { state, refresh, loadMore } = useElementLibrary(
    brandId,
    market,
    dateSelection,
    filters.serverRules,
  )
  const fetchedAt = state.status === 'success' ? state.data.fetchedAt : null
  const loadingMore = state.status === 'success' && state.loadingMore
  const hasMore = state.status === 'success' && state.data.nextOffset !== null

  const rows = useMemo(
    () => (state.status === 'success' ? state.data.items : EMPTY_ROWS),
    [state],
  )

  const creatives = useMemo(() => toCreativeElements(rows), [rows])
  const primaries = useMemo(() => toTextElements(rows, 'primary'), [rows])
  const headlinesList = useMemo(() => toTextElements(rows, 'headline'), [rows])
  const urlsList = useMemo(() => toUrlElements(rows), [rows])

  const counts: Record<ElementTabId, number> = {
    creatives: creatives.length,
    primary: primaries.length,
    headline: headlinesList.length,
    urls: urlsList.length,
  }

  const { viewRules } = filters
  const rankedCreatives = useMemo(() => {
    const filtered = creatives.filter(
      (c) => creativeMatchesRules(c, viewRules) && matchesSearch(c.label, search),
    )
    return rankElements(filtered, sort.field, sort.direction)
  }, [creatives, viewRules, search, sort.field, sort.direction])

  const kind = tabKind(activeTab)
  const isCreatives = kind === 'creative'
  const isUrls = kind === 'url'

  let activeTextSource = primaries
  if (activeTab === 'headline') {
    activeTextSource = headlinesList
  } else if (activeTab === 'urls') {
    activeTextSource = urlsList
  }
  const rankedTexts = useMemo(() => {
    const filtered = activeTextSource.filter(
      (t) => textMatchesRules(t.metrics, viewRules) && matchesSearch(t.text, search),
    )
    return rankElements(filtered, sort.field, sort.direction)
  }, [activeTextSource, viewRules, search, sort.field, sort.direction])

  const totalShown = isCreatives ? rankedCreatives.length : rankedTexts.length

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE)
  }, [activeTab, filters.rules, search, sort.field, sort.direction])

  function handleTabChange(_event: unknown, next: ElementTabId): void {
    setActiveTab(next)
    setSearch('')
  }

  const variationList = activeTab === 'headline' ? headlines : primaryTexts
  const variationFull = isVariationListFull(variationList)
  const onAddVariation = activeTab === 'headline' ? onAddHeadline : onAddPrimaryText

  function isTextAdded(text: string): boolean {
    return isUrls ? url.trim() === text.trim() : hasTextVariation(variationList, text)
  }
  function addText(text: string): void {
    if (isUrls) {
      onAddUrl(text)
    } else {
      onAddVariation(text)
    }
  }

  // Two levels: reveal more of the already-loaded set first; once it is exhausted
  // and the server has more pages, fetch the next page (and reveal a step of it).
  function handleLoadMore(): void {
    if (visibleCount < totalShown) {
      setVisibleCount((n) => n + VISIBLE_STEP)
      return
    }
    if (hasMore) {
      setVisibleCount((n) => n + VISIBLE_STEP)
      loadMore()
    }
  }

  const localRemaining = totalShown - visibleCount
  let loadMoreLabel = 'Load more'
  if (loadingMore) {
    loadMoreLabel = 'Loading…'
  } else if (localRemaining > 0) {
    loadMoreLabel = `Load more (${localRemaining})`
  }
  const countSuffix = hasMore ? '+' : ''

  return (
    <Box component="aside" className={styles.root} aria-label="Creative library">
      <Box className={styles.header}>
        <Typography component="h2" variant="inherit" className={styles.title}>
          Ad Library
        </Typography>
        <Box className={styles.headerControls}>
          <UpdatedBadge fetchedAt={fetchedAt} onRefresh={refresh} disabled={state.status === 'loading'} />
          <DateRangeDropdown
            value={dateSelection}
            onPresetChange={(preset: DatePreset) => setDateSelection({ kind: 'preset', preset })}
            onCustomRangeChange={(range: CustomRange) => setDateSelection({ kind: 'custom', range })}
            comparisonEnabled={false}
            onComparisonChange={NOOP_COMPARISON}
            comparisonDisabled
          />
        </Box>
      </Box>
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        className={styles.tabs}
      >
        {ELEMENT_TABS.map((tab) => (
          <Tab
            key={tab.id}
            value={tab.id}
            label={`${tab.label} (${counts[tab.id]}${countSuffix})`}
            className={styles.tab}
            disableRipple
          />
        ))}
      </Tabs>

      {state.status === 'loading' && (
        <Box className={styles.message}>
          <CenteredSpinner label="Loading library…" />
        </Box>
      )}

      {state.status === 'no-token' && (
        <Box className={styles.message}>
          <EmptyState
            title="Connect this brand first"
            description="The Business Manager connection for this brand is not configured yet."
          />
        </Box>
      )}

      {state.status === 'error' && (
        <Box className={styles.message}>
          <ErrorPanel title="Couldn't load the library" message={state.message} onRetry={refresh} />
        </Box>
      )}

      {state.status === 'success' && (
        <>
          <Box className={styles.controls}>
            <Box className={styles.filterSection}>
              <ElementFilterChips
                presets={tabDef.presets}
                activePreset={filters.activePreset}
                rules={filters.rules}
                onSelectPreset={filters.selectPreset}
                onOpenAddFilter={() => setAddFilterOpen(true)}
                onUpdateRule={filters.updateRule}
                onRemoveRule={filters.removeRule}
              />
            </Box>
            <ElementToolbar
              shown={Math.min(visibleCount, totalShown)}
              total={totalShown}
              hasMore={hasMore}
              noun={NOUN_BY_KIND[kind]}
              searchPlaceholder={SEARCH_PLACEHOLDER_BY_KIND[kind]}
              sortField={sort.field}
              sortDirection={sort.direction}
              sortFields={tabDef.sortFields}
              onSortChange={sort.onChange}
              onSearchChange={setSearch}
            />
          </Box>

          {totalShown === 0 && !hasMore ? (
            <Box className={styles.message}>
              <EmptyState
                title="Nothing here yet"
                description="No elements match the current filters for this brand's recent ads."
              />
            </Box>
          ) : (
            <Box className={styles.scroll}>
              {totalShown === 0 && (
                <Box className={styles.message}>
                  <EmptyState
                    title="No matches in the loaded set"
                    description="Load more ads below to widen the search."
                  />
                </Box>
              )}
              {totalShown > 0 && isCreatives && (
                <Box className={styles.grid}>
                  {rankedCreatives.slice(0, visibleCount).map(({ item }) => {
                    const asset = creativeToAsset(item)
                    return (
                      <CreativeCard
                        key={item.key}
                        adId={item.adId}
                        accountId={item.accountId}
                        creativeType={item.creativeType}
                        thumbnailUrl={item.thumbnailUrl}
                        imageUrl={item.imageUrl}
                        label={item.label}
                        metrics={item.metrics}
                        metricFields={filters.cardFields}
                        added={asset !== null && addedAssetKeys.has(asset.assetKey)}
                        disabled={asset === null}
                        disabledReason={asset === null ? NO_SOURCE_REASON : undefined}
                        onAdd={asset ? () => onAddCreative(asset) : NOOP}
                      />
                    )
                  })}
                </Box>
              )}
              {totalShown > 0 && !isCreatives && (
                <Box className={styles.list}>
                  {rankedTexts.slice(0, visibleCount).map(({ rank, item }) => (
                    <TextElementRow
                      key={item.key}
                      rank={rank}
                      text={item.text}
                      usedInAds={item.usedInAds}
                      metrics={item.metrics}
                      metricFields={filters.cardFields}
                      added={isTextAdded(item.text)}
                      disabled={!isUrls && variationFull}
                      onAdd={() => addText(item.text)}
                    />
                  ))}
                </Box>
              )}

              {(visibleCount < totalShown || hasMore) && (
                <Box className={styles.loadMoreWrap}>
                  <Button
                    type="button"
                    variant="outlined"
                    color="inherit"
                    disabled={loadingMore}
                    onClick={handleLoadMore}
                    className={styles.loadMore}
                  >
                    {loadMoreLabel}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

      <AdvancedFilters
        open={addFilterOpen}
        onClose={() => setAddFilterOpen(false)}
        onAdd={filters.addRule}
        fields={filterFieldsFor(activeTab)}
      />
    </Box>
  )
})
