#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const SRC = path.resolve('src')

const COMPONENT_NAMES = [
  'AdAccountSummary', 'CampaignsList', 'MetaAdsView', 'Notice',
  'CopyForm', 'FilePicker', 'FormField', 'JobRow', 'JobsPanel',
  'LaunchAdsTab', 'TargetingForm', 'UploadHistory',
  'AccountBreakdown', 'KpiGrid', 'KpiSkeletonRows', 'Leaderboards',
  'OverviewContent', 'OverviewTab', 'SpendChart', 'SpendChartTooltip',
  'AdsMobileCard', 'AdsTable', 'AdsTableDesktopRow', 'AdvancedFilters',
  'BenchmarkLegend', 'ColumnPicker', 'FilterChips', 'LoadMore',
  'PerformanceTab', 'RuleChip', 'Toolbar', 'WinnerLoserBadge',
  'AdThumbnail', 'CalendarPicker', 'DateRangeDropdown', 'LeaderboardCard',
  'LeaderboardRow', 'Section', 'StatusDot',
  'CardBody', 'CardContent', 'CardEmpty', 'CardError', 'CardFooter',
  'CardHeader', 'CardMedia', 'CardSkeleton', 'CreativePreviewCard',
  'CreativePreviewProvider',
]

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, acc)
    } else if (/\.(tsx?|mjs|js)$/.test(entry.name)) {
      acc.push(full)
    }
  }
  return acc
}

const files = walk(SRC)
let changed = 0

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content

  for (const name of COMPONENT_NAMES) {
    const re = new RegExp(`(['"\`])(\\.{1,2}/(?:[^'"\`]*?/)?)${name}\\1`, 'g')
    content = content.replace(re, (m, q, prefix) => {
      if (prefix.endsWith(`${name}/`)) return m
      const newSpec = `${q}${prefix}${name}/${name}${q}`
      const dir = path.dirname(file)
      const resolved = path.resolve(dir, `${prefix}${name}/${name}`)
      const candidates = [`${resolved}.tsx`, `${resolved}.ts`]
      const exists = candidates.some((c) => fs.existsSync(c))
      return exists ? newSpec : m
    })
  }

  if (content !== original) {
    fs.writeFileSync(file, content)
    changed++
  }
}

console.log(`Fixed sibling imports in ${changed} files`)
