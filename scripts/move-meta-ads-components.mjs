#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const PROJECT_ROOT = process.cwd()
const META_ADS = 'src/app/brands/[brandId]/(advertising)/meta-ads/components'

const COMPONENT_FILES = [
  'AdAccountSummary.tsx',
  'CampaignsList.tsx',
  'MetaAdsView.tsx',
  'Notice.tsx',
  'launch/CopyForm.tsx',
  'launch/FilePicker.tsx',
  'launch/FormField.tsx',
  'launch/JobRow.tsx',
  'launch/JobsPanel.tsx',
  'launch/LaunchAdsTab.tsx',
  'launch/TargetingForm.tsx',
  'launch/UploadHistory.tsx',
  'overview/AccountBreakdown.tsx',
  'overview/KpiGrid.tsx',
  'overview/KpiSkeletonRows.tsx',
  'overview/Leaderboards.tsx',
  'overview/OverviewContent.tsx',
  'overview/OverviewTab.tsx',
  'overview/SpendChart.tsx',
  'overview/SpendChartTooltip.tsx',
  'performance/AdsMobileCard.tsx',
  'performance/AdsTable.tsx',
  'performance/AdsTableDesktopRow.tsx',
  'performance/AdvancedFilters.tsx',
  'performance/BenchmarkLegend.tsx',
  'performance/ColumnPicker.tsx',
  'performance/FilterChips.tsx',
  'performance/LoadMore.tsx',
  'performance/PerformanceTab.tsx',
  'performance/RuleChip.tsx',
  'performance/Toolbar.tsx',
  'performance/WinnerLoserBadge.tsx',
  'shared/AdThumbnail.tsx',
  'shared/CalendarPicker.tsx',
  'shared/DateRangeDropdown.tsx',
  'shared/LeaderboardCard.tsx',
  'shared/LeaderboardRow.tsx',
  'shared/Section.tsx',
  'shared/StatusDot.tsx',
  'shared/CreativePreview/CardBody.tsx',
  'shared/CreativePreview/CardContent.tsx',
  'shared/CreativePreview/CardEmpty.tsx',
  'shared/CreativePreview/CardError.tsx',
  'shared/CreativePreview/CardFooter.tsx',
  'shared/CreativePreview/CardHeader.tsx',
  'shared/CreativePreview/CardMedia.tsx',
  'shared/CreativePreview/CardSkeleton.tsx',
  'shared/CreativePreview/CreativePreviewCard.tsx',
  'shared/CreativePreview/CreativePreviewProvider.tsx',
]

function abs(rel) {
  return path.resolve(PROJECT_ROOT, rel)
}

const renameMap = new Map()
const moves = []

for (const rel of COMPONENT_FILES) {
  const base = path.basename(rel, '.tsx')
  const dir = path.dirname(rel)
  const oldTsxRel = `${META_ADS}/${rel}`
  const newTsxRel = `${META_ADS}/${dir === '.' ? '' : `${dir}/`}${base}/${base}.tsx`

  renameMap.set(abs(oldTsxRel), abs(newTsxRel))
  if (fs.existsSync(abs(oldTsxRel))) {
    moves.push([oldTsxRel, newTsxRel])
  }

  const oldCssRel = oldTsxRel.replace(/\.tsx$/, '.module.css')
  const newCssRel = newTsxRel.replace(/\.tsx$/, '.module.css')
  renameMap.set(abs(oldCssRel), abs(newCssRel))
  if (fs.existsSync(abs(oldCssRel))) {
    moves.push([oldCssRel, newCssRel])
  }
}

console.log(`Plan: ${moves.length} files to move (${COMPONENT_FILES.length} components)`)

function runMoves() {
  const dirsCreated = new Set()
  for (const [oldP, newP] of moves) {
    const newDir = path.dirname(newP)
    if (!dirsCreated.has(newDir)) {
      fs.mkdirSync(abs(newDir), { recursive: true })
      dirsCreated.add(newDir)
    }
    try {
      execSync(`git mv "${oldP}" "${newP}"`, { stdio: 'pipe' })
    } catch (err) {
      const oldAbs = abs(oldP)
      const newAbs = abs(newP)
      if (fs.existsSync(oldAbs)) {
        fs.renameSync(oldAbs, newAbs)
      } else {
        console.error(`git mv failed for ${oldP} -> ${newP}: ${err.message}`)
      }
    }
  }
  console.log(`Moved ${moves.length} files`)
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

const SRC_ABS = abs('src')

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
  const srcDir = abs('src')
  const files = collectSourceFiles(srcDir)
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

const mode = process.argv[2] || 'all'
if (mode === 'plan') {
  for (const [a, b] of moves) console.log(`${a}  ->  ${b}`)
} else if (mode === 'move') {
  runMoves()
} else if (mode === 'rewrite') {
  rewriteAllImports()
} else {
  runMoves()
  rewriteAllImports()
}
