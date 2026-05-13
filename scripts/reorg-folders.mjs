#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const PROJECT_ROOT = process.cwd()
const SRC_ABS = path.resolve(PROJECT_ROOT, 'src')

const PHASES = {
  '5-layout-split': [
    ['src/components/layout/Sidebar/BrandSwitcher/BrandMenu.tsx', 'src/components/layout/Sidebar/BrandSwitcher/BrandMenu/BrandMenu.tsx'],
    ['src/components/layout/Sidebar/BrandSwitcher/BrandMenuEmpty.tsx', 'src/components/layout/Sidebar/BrandSwitcher/BrandMenuEmpty/BrandMenuEmpty.tsx'],
    ['src/components/layout/Sidebar/BrandSwitcher/BrandMenuItem.tsx', 'src/components/layout/Sidebar/BrandSwitcher/BrandMenuItem/BrandMenuItem.tsx'],
    ['src/components/layout/Sidebar/BrandSwitcher/BrandMenuSearch.tsx', 'src/components/layout/Sidebar/BrandSwitcher/BrandMenuSearch/BrandMenuSearch.tsx'],
    ['src/components/layout/Sidebar/BrandSwitcher/BrandSwitcherTrigger.tsx', 'src/components/layout/Sidebar/BrandSwitcher/BrandSwitcherTrigger/BrandSwitcherTrigger.tsx'],
    ['src/components/layout/Sidebar/SidebarNav/NavItemView.tsx', 'src/components/layout/Sidebar/SidebarNav/NavItemView/NavItemView.tsx'],
    ['src/components/layout/Sidebar/SidebarNav/NavPanelView.tsx', 'src/components/layout/Sidebar/SidebarNav/NavPanelView/NavPanelView.tsx'],
    ['src/components/layout/Sidebar/SidebarNav/NavSectionView.tsx', 'src/components/layout/Sidebar/SidebarNav/NavSectionView/NavSectionView.tsx'],
    ['src/components/layout/Sidebar/SidebarUserCard/ThemeToggleButton.tsx', 'src/components/layout/Sidebar/SidebarUserCard/ThemeToggleButton/ThemeToggleButton.tsx'],
    ['src/components/layout/Topbar/MarketSwitcher/MarketMenu.tsx', 'src/components/layout/Topbar/MarketSwitcher/MarketMenu/MarketMenu.tsx'],
    ['src/components/layout/Topbar/MarketSwitcher/MarketMenuItem.tsx', 'src/components/layout/Topbar/MarketSwitcher/MarketMenuItem/MarketMenuItem.tsx'],
    ['src/components/layout/Topbar/MarketSwitcher/MarketSwitcherTrigger.tsx', 'src/components/layout/Topbar/MarketSwitcher/MarketSwitcherTrigger/MarketSwitcherTrigger.tsx'],
    ['src/components/layout/PageHeader/UpdatedBadge.tsx', 'src/components/layout/PageHeader/UpdatedBadge/UpdatedBadge.tsx'],
    ['src/components/kpi/KpiSparkline/KpiSparklineTooltip.tsx', 'src/components/kpi/KpiSparkline/KpiSparklineTooltip/KpiSparklineTooltip.tsx'],
  ],
  '1-brands': [
    ['src/Section/brands/BrandsOverview.tsx', 'src/Section/brands/BrandsOverview/BrandsOverview.tsx'],
    ['src/Section/brands/BrandCard.tsx', 'src/Section/brands/BrandsOverview/BrandCard/BrandCard.tsx'],
  ],
  '2-dashboard': [
    ['src/Section/dashboard/KlaviyoChannelSection/BreakdownItem.tsx', 'src/Section/dashboard/KlaviyoChannelSection/BreakdownItem/BreakdownItem.tsx'],
    ['src/Section/dashboard/KlaviyoChannelSection/EngagementTile.tsx', 'src/Section/dashboard/KlaviyoChannelSection/EngagementTile/EngagementTile.tsx'],
    ['src/Section/dashboard/KlaviyoChannelSection/HeroWithBreakdown.tsx', 'src/Section/dashboard/KlaviyoChannelSection/HeroWithBreakdown/HeroWithBreakdown.tsx'],
    ['src/Section/dashboard/KlaviyoChannelSection/MiniBar.tsx', 'src/Section/dashboard/KlaviyoChannelSection/MiniBar/MiniBar.tsx'],
    ['src/Section/dashboard/DashboardChart/DashboardChartTooltip.tsx', 'src/Section/dashboard/DashboardChart/DashboardChartTooltip/DashboardChartTooltip.tsx'],
    ['src/Section/dashboard/DashboardChartLegend/LegendDot.tsx', 'src/Section/dashboard/DashboardChartLegend/LegendDot/LegendDot.tsx'],
    ['src/Section/dashboard/DashboardSpendBreakdown/SpendBreakdownLegendRow.tsx', 'src/Section/dashboard/DashboardSpendBreakdown/SpendBreakdownLegendRow/SpendBreakdownLegendRow.tsx'],
    ['src/Section/dashboard/DashboardAnalytics/DashboardAnalytics.tsx', 'src/Section/dashboard/DashboardOverview/DashboardAnalytics/DashboardAnalytics.tsx'],
    ['src/Section/dashboard/AnalyticsDevices/AnalyticsDevices.tsx', 'src/Section/dashboard/DashboardOverview/AnalyticsDevices/AnalyticsDevices.tsx'],
    ['src/Section/dashboard/AnalyticsFunnel/AnalyticsFunnel.tsx', 'src/Section/dashboard/DashboardOverview/AnalyticsFunnel/AnalyticsFunnel.tsx'],
    ['src/Section/dashboard/AnalyticsTopPages/AnalyticsTopPages.tsx', 'src/Section/dashboard/DashboardOverview/AnalyticsTopPages/AnalyticsTopPages.tsx'],
    ['src/Section/dashboard/AnalyticsTrafficSources/AnalyticsTrafficSources.tsx', 'src/Section/dashboard/DashboardOverview/AnalyticsTrafficSources/AnalyticsTrafficSources.tsx'],
    ['src/Section/dashboard/DashboardCategoryBreakdown/DashboardCategoryBreakdown.tsx', 'src/Section/dashboard/DashboardOverview/DashboardCategoryBreakdown/DashboardCategoryBreakdown.tsx'],
    ['src/Section/dashboard/DashboardChannelsBreakdown/DashboardChannelsBreakdown.tsx', 'src/Section/dashboard/DashboardOverview/DashboardChannelsBreakdown/DashboardChannelsBreakdown.tsx'],
    ['src/Section/dashboard/GoogleAdsChannelSection/GoogleAdsChannelSection.tsx', 'src/Section/dashboard/DashboardOverview/GoogleAdsChannelSection/GoogleAdsChannelSection.tsx'],
    ['src/Section/dashboard/MetaChannelSection/MetaChannelSection.tsx', 'src/Section/dashboard/DashboardOverview/MetaChannelSection/MetaChannelSection.tsx'],
    ['src/Section/dashboard/DashboardHeaderActions/DashboardHeaderActions.tsx', 'src/Section/dashboard/DashboardOverview/DashboardHeaderActions/DashboardHeaderActions.tsx'],
    ['src/Section/dashboard/DashboardKpiGrid/DashboardKpiGrid.tsx', 'src/Section/dashboard/DashboardOverview/DashboardKpiGrid/DashboardKpiGrid.tsx'],
    ['src/Section/dashboard/DashboardProductsBreakdown/DashboardProductsBreakdown.tsx', 'src/Section/dashboard/DashboardOverview/DashboardProductsBreakdown/DashboardProductsBreakdown.tsx'],
    ['src/Section/dashboard/KpiSkeletons/KpiSkeletons.tsx', 'src/Section/dashboard/DashboardOverview/KpiSkeletons/KpiSkeletons.tsx'],
  ],
  '3-meta-ads': [
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/MetaAdsView/MetaAdsView.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/MetaAdsView/MetaAdsView.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/AdAccountSummary/AdAccountSummary.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/MetaAdsView/AdAccountSummary/AdAccountSummary.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/CampaignsList/CampaignsList.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/MetaAdsView/CampaignsList/CampaignsList.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/FilePicker/FilePicker.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/LaunchAdsTab/FilePicker/FilePicker.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/CopyForm/CopyForm.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/LaunchAdsTab/CopyForm/CopyForm.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/TargetingForm/TargetingForm.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/LaunchAdsTab/TargetingForm/TargetingForm.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/JobsPanel/JobsPanel.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/LaunchAdsTab/JobsPanel/JobsPanel.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/JobRow/JobRow.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/LaunchAdsTab/JobRow/JobRow.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/UploadHistory/UploadHistory.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/launch/LaunchAdsTab/UploadHistory/UploadHistory.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/OverviewContent/OverviewContent.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/OverviewTab/OverviewContent/OverviewContent.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/AccountBreakdown/AccountBreakdown.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/OverviewTab/AccountBreakdown/AccountBreakdown.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/Leaderboards/Leaderboards.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/OverviewTab/Leaderboards/Leaderboards.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/SpendChart/SpendChart.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/OverviewTab/SpendChart/SpendChart.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/SpendChartTooltip/SpendChartTooltip.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/overview/OverviewTab/SpendChartTooltip/SpendChartTooltip.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/AdsTable/AdsTable.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/AdsTable/AdsTable.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/AdsMobileCard/AdsMobileCard.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/AdsMobileCard/AdsMobileCard.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/AdsTableDesktopRow/AdsTableDesktopRow.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/AdsTableDesktopRow/AdsTableDesktopRow.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/AdvancedFilters/AdvancedFilters.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/AdvancedFilters/AdvancedFilters.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/FilterChips/FilterChips.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/FilterChips/FilterChips.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/RuleChip/RuleChip.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/RuleChip/RuleChip.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/Toolbar/Toolbar.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/Toolbar/Toolbar.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/ColumnPicker/ColumnPicker.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/ColumnPicker/ColumnPicker.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/BenchmarkLegend/BenchmarkLegend.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/BenchmarkLegend/BenchmarkLegend.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/LoadMore/LoadMore.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/performance/PerformanceTab/LoadMore/LoadMore.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CalendarPicker/CalendarPicker.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/DateRangeDropdown/CalendarPicker/CalendarPicker.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardBody/CardBody.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardBody/CardBody.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardContent/CardContent.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardContent/CardContent.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardEmpty/CardEmpty.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardEmpty/CardEmpty.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardError/CardError.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardError/CardError.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardFooter/CardFooter.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardFooter/CardFooter.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardHeader/CardHeader.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardHeader/CardHeader.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardMedia/CardMedia.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardMedia/CardMedia.tsx'],
    ['src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CardSkeleton/CardSkeleton.tsx', 'src/app/brands/[brandId]/(advertising)/meta-ads/components/shared/CreativePreview/CreativePreviewCard/CardSkeleton/CardSkeleton.tsx'],
  ],
  '4-trending-news': [
    ['src/Section/trending-news/components/NewsItem/NewsItem.tsx', 'src/Section/trending-news/components/NewsBlock/NewsItem/NewsItem.tsx'],
    ['src/Section/trending-news/components/TopicPanel/TopicContent/TopicContent.tsx', 'src/Section/trending-news/components/MarketPanel/TopicContent/TopicContent.tsx'],
    ['src/Section/trending-news/components/TopicPanel/LoadingSkeleton/LoadingSkeleton.tsx', 'src/Section/trending-news/components/MarketPanel/LoadingSkeleton/LoadingSkeleton.tsx'],
    ['src/components/ui/DebouncedSearchInput/DebouncedSearchInput.tsx', 'src/components/layout/Sidebar/BrandSwitcher/BrandMenuSearch/DebouncedSearchInput/DebouncedSearchInput.tsx'],
  ],
}

const phase = process.argv[2]
const mode = process.argv[3] || 'all'

if (!phase || !PHASES[phase]) {
  console.error(`Usage: node scripts/reorg-folders.mjs <phase> [plan|move|rewrite|all]`)
  console.error(`Phases: ${Object.keys(PHASES).join(', ')}`)
  process.exit(1)
}

const sourceMoves = PHASES[phase].filter(([from, to]) => from !== to)

// For each .tsx move, auto-add associated .module.css and .helpers.ts (if present)
function expandMove(from, to) {
  const out = [[from, to]]
  if (/\.tsx?$/.test(from)) {
    const cssFrom = from.replace(/\.tsx?$/, '.module.css')
    if (fs.existsSync(path.resolve(PROJECT_ROOT, cssFrom))) {
      out.push([cssFrom, to.replace(/\.tsx?$/, '.module.css')])
    }
    const helpersFrom = from.replace(/\.tsx?$/, '.helpers.ts')
    if (fs.existsSync(path.resolve(PROJECT_ROOT, helpersFrom))) {
      out.push([helpersFrom, to.replace(/\.tsx?$/, '.helpers.ts')])
    }
  }
  return out
}

const expandedMoves = sourceMoves.flatMap(([from, to]) => expandMove(from, to))

const renameMap = new Map()
for (const [from, to] of expandedMoves) {
  renameMap.set(path.resolve(PROJECT_ROOT, from), path.resolve(PROJECT_ROOT, to))
}

console.log(`Phase ${phase}: ${sourceMoves.length} primary moves -> ${expandedMoves.length} total (incl. .module.css / .helpers.ts)`)

function runMoves() {
  const dirsCreated = new Set()
  let moved = 0
  for (const [oldAbs, newAbs] of renameMap.entries()) {
    if (!fs.existsSync(oldAbs)) {
      continue
    }
    const newDir = path.dirname(newAbs)
    if (!dirsCreated.has(newDir)) {
      fs.mkdirSync(newDir, { recursive: true })
      dirsCreated.add(newDir)
    }
    const oldRel = path.relative(PROJECT_ROOT, oldAbs)
    const newRel = path.relative(PROJECT_ROOT, newAbs)
    try {
      execSync(`git mv "${oldRel}" "${newRel}"`, { stdio: 'pipe' })
    } catch (err) {
      try {
        fs.renameSync(oldAbs, newAbs)
      } catch (e) {
        console.error(`Move failed: ${oldRel} -> ${newRel}: ${e.message}`)
        continue
      }
    }
    moved++
  }
  console.log(`Moved ${moved} files`)
}

function collectSourceFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      collectSourceFiles(full, acc)
    } else if (/\.(tsx?|mjs|js)$/.test(entry.name)) {
      acc.push(full)
    }
  }
  return acc
}

function tryResolveOldImport(specOldAbsBase) {
  const hasFileExt = /\.(module\.css|tsx?|json|mjs|js)$/.test(specOldAbsBase)
  const candidates = hasFileExt
    ? [specOldAbsBase]
    : [
      `${specOldAbsBase}.tsx`,
      `${specOldAbsBase}.ts`,
      `${specOldAbsBase}.module.css`,
      `${specOldAbsBase}/index.tsx`,
      `${specOldAbsBase}/index.ts`,
    ]
  for (const c of candidates) {
    if (renameMap.has(c)) return c
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  }
  return null
}

function rewriteFile(filePath) {
  const fileNewAbs = filePath
  let fileOldAbs = fileNewAbs
  for (const [oldP, newP] of renameMap.entries()) {
    if (newP === fileNewAbs) {
      fileOldAbs = oldP
      break
    }
  }
  const fileOldDir = path.dirname(fileOldAbs)
  const fileNewDir = path.dirname(fileNewAbs)

  let content = fs.readFileSync(fileNewAbs, 'utf8')
  let mutated = false

  const relImportRe = /(\bfrom\s+|\bimport\s+|\bexport\s+\*\s+from\s+|\bexport\s+\{[^}]*\}\s+from\s+)(['"])(\.{1,2}\/[^'"]+)(['"])/g
  const aliasImportRe = /(\bfrom\s+|\bimport\s+|\bexport\s+\*\s+from\s+|\bexport\s+\{[^}]*\}\s+from\s+)(['"])(@\/[^'"]+)(['"])/g
  const dynRelRe = /(\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)(['"])(\s*\))/g
  const dynAliasRe = /(\bimport\s*\(\s*)(['"])(@\/[^'"]+)(['"])(\s*\))/g

  function finalizeRelSpec(rel) {
    let r = rel.split(path.sep).join('/')
    if (!r.startsWith('.')) r = `./${r}`
    r = r.replace(/\.module\.css$/, '__KEEP_CSS__')
    r = r.replace(/\.tsx?$/, '')
    r = r.replace(/\/index$/, '')
    r = r.replace(/__KEEP_CSS__$/, '.module.css')
    return r
  }

  function makeNewRelSpec(spec) {
    const specOldAbsBase = path.resolve(fileOldDir, spec)
    const resolvedOld = tryResolveOldImport(specOldAbsBase)
    if (!resolvedOld) return null
    const resolvedNew = renameMap.get(resolvedOld) || resolvedOld
    return finalizeRelSpec(path.relative(fileNewDir, resolvedNew))
  }

  function makeNewAliasSpec(spec) {
    const tail = spec.slice(2)
    const specOldAbsBase = path.join(SRC_ABS, tail)
    const resolvedOld = tryResolveOldImport(specOldAbsBase)
    if (!resolvedOld) return null
    const resolvedNew = renameMap.get(resolvedOld) || resolvedOld
    let rel = path.relative(SRC_ABS, resolvedNew).split(path.sep).join('/')
    rel = rel.replace(/\.module\.css$/, '__KEEP_CSS__')
    rel = rel.replace(/\.tsx?$/, '')
    rel = rel.replace(/\/index$/, '')
    rel = rel.replace(/__KEEP_CSS__$/, '.module.css')
    return `@/${rel}`
  }

  content = content.replace(relImportRe, (m, prefix, q1, spec, q2) => {
    const newSpec = makeNewRelSpec(spec)
    if (newSpec === null || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}`
  })

  content = content.replace(dynRelRe, (m, prefix, q1, spec, q2, suffix) => {
    const newSpec = makeNewRelSpec(spec)
    if (newSpec === null || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}${suffix}`
  })

  content = content.replace(aliasImportRe, (m, prefix, q1, spec, q2) => {
    const newSpec = makeNewAliasSpec(spec)
    if (newSpec === null || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}`
  })

  content = content.replace(dynAliasRe, (m, prefix, q1, spec, q2, suffix) => {
    const newSpec = makeNewAliasSpec(spec)
    if (newSpec === null || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}${suffix}`
  })

  if (mutated) {
    fs.writeFileSync(fileNewAbs, content)
  }
  return mutated
}

function rewriteAllImports() {
  const files = collectSourceFiles(SRC_ABS)
  let count = 0
  for (const f of files) {
    try {
      if (rewriteFile(f)) count++
    } catch (err) {
      console.error(`Rewrite failed: ${f}: ${err.message}`)
    }
  }
  console.log(`Rewrote imports in ${count} files`)
}

if (mode === 'plan') {
  for (const [a, b] of expandedMoves) console.log(`${a}  ->  ${b}`)
} else if (mode === 'move') {
  runMoves()
} else if (mode === 'rewrite') {
  rewriteAllImports()
} else {
  runMoves()
  rewriteAllImports()
}
