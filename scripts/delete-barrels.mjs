#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const PROJECT_ROOT = process.cwd()
const SRC_ABS = path.resolve(PROJECT_ROOT, 'src')

const TARGET_ROOT = process.argv[2]
if (!TARGET_ROOT) {
  console.error('Usage: node scripts/delete-barrels.mjs <path-under-src> (e.g. src/Section/dashboard)')
  process.exit(1)
}

const ROOT_ABS = path.resolve(PROJECT_ROOT, TARGET_ROOT)

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else if (/\.(tsx?|mjs|js)$/.test(entry.name)) acc.push(full)
  }
  return acc
}

const allSourceFiles = walk(SRC_ABS)

// Find all index.ts barrels inside TARGET_ROOT
const barrels = []
function findBarrels(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) findBarrels(full)
    else if (entry.name === 'index.ts' || entry.name === 'index.tsx') barrels.push(full)
  }
}
findBarrels(ROOT_ABS)

console.log(`Found ${barrels.length} barrels under ${TARGET_ROOT}`)

// Parse each barrel to find what file it points to
const barrelRedirectMap = new Map() // absolute barrel path -> resolved final target file absolute path
function resolveImport(specBase) {
  const candidates = [
    `${specBase}.tsx`,
    `${specBase}.ts`,
    `${specBase}/index.tsx`,
    `${specBase}/index.ts`,
  ]
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  }
  return null
}

function followRedirects(filePath, seen = new Set()) {
  if (seen.has(filePath)) return null
  seen.add(filePath)
  const content = fs.readFileSync(filePath, 'utf8')
  // Look for "import X from './Y'" or "export { default } from './Y'" or "export * from './Y'"
  const importRe = /(?:import\s+\w+\s+from|export\s+\{[^}]*\}\s+from|export\s+\*\s+from)\s+['"](\.{1,2}\/[^'"]+)['"]/g
  const dir = path.dirname(filePath)
  const match = importRe.exec(content)
  const firstSpec = match ? match[1] : null
  if (!firstSpec) return filePath
  const resolved = resolveImport(path.resolve(dir, firstSpec))
  if (!resolved) return null
  // If resolved is another barrel, recurse
  if (path.basename(resolved) === 'index.ts' || path.basename(resolved) === 'index.tsx') {
    return followRedirects(resolved, seen)
  }
  return resolved
}

for (const barrel of barrels) {
  const target = followRedirects(barrel)
  if (target) {
    barrelRedirectMap.set(barrel, target)
  } else {
    console.warn(`Could not resolve barrel target: ${path.relative(PROJECT_ROOT, barrel)}`)
  }
}

console.log(`Resolved ${barrelRedirectMap.size} barrel targets`)

// Build a folder -> target file map for rewriting bare-folder imports
const folderToTarget = new Map() // absolute folder path -> absolute target .tsx
for (const [barrel, target] of barrelRedirectMap.entries()) {
  folderToTarget.set(path.dirname(barrel), target)
}

// For each source file in the repo, find bare-folder imports pointing into folderToTarget and rewrite
function rewriteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let mutated = false
  const dir = path.dirname(filePath)

  function rewriteSpec(spec) {
    const base = spec.startsWith('@/')
      ? path.join(SRC_ABS, spec.slice(2))
      : path.resolve(dir, spec)
    // Is base a directory in folderToTarget?
    if (!folderToTarget.has(base)) {
      // Maybe with /index appended
      return null
    }
    const target = folderToTarget.get(base)
    let rel
    if (spec.startsWith('@/')) {
      rel = path.relative(SRC_ABS, target).split(path.sep).join('/')
      return `@/${rel.replace(/\.tsx?$/, '')}`
    }
    rel = path.relative(dir, target).split(path.sep).join('/')
    if (!rel.startsWith('.')) rel = `./${rel}`
    return rel.replace(/\.tsx?$/, '')
  }

  const relImportRe = /(\bfrom\s+|\bimport\s+|\bexport\s+\*\s+from\s+|\bexport\s+\{[^}]*\}\s+from\s+)(['"])(\.{1,2}\/[^'"]+)(['"])/g
  const aliasImportRe = /(\bfrom\s+|\bimport\s+|\bexport\s+\*\s+from\s+|\bexport\s+\{[^}]*\}\s+from\s+)(['"])(@\/[^'"]+)(['"])/g
  const dynRelRe = /(\bimport\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)(['"])(\s*\))/g
  const dynAliasRe = /(\bimport\s*\(\s*)(['"])(@\/[^'"]+)(['"])(\s*\))/g

  content = content.replace(relImportRe, (m, prefix, q1, spec, q2) => {
    const newSpec = rewriteSpec(spec)
    if (!newSpec || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}`
  })
  content = content.replace(aliasImportRe, (m, prefix, q1, spec, q2) => {
    const newSpec = rewriteSpec(spec)
    if (!newSpec || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}`
  })
  content = content.replace(dynRelRe, (m, prefix, q1, spec, q2, suffix) => {
    const newSpec = rewriteSpec(spec)
    if (!newSpec || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}${suffix}`
  })
  content = content.replace(dynAliasRe, (m, prefix, q1, spec, q2, suffix) => {
    const newSpec = rewriteSpec(spec)
    if (!newSpec || newSpec === spec) return m
    mutated = true
    return `${prefix}${q1}${newSpec}${q2}${suffix}`
  })

  if (mutated) {
    fs.writeFileSync(filePath, content)
    return true
  }
  return false
}

let rewroteCount = 0
for (const f of allSourceFiles) {
  // Skip the barrels themselves — they'll be deleted
  if (barrelRedirectMap.has(f)) continue
  try {
    if (rewriteFile(f)) rewroteCount++
  } catch (err) {
    console.error(`Rewrite failed: ${path.relative(PROJECT_ROOT, f)}: ${err.message}`)
  }
}
console.log(`Rewrote bare-folder imports in ${rewroteCount} files`)

// Delete barrels (git rm if tracked)
let deletedCount = 0
for (const barrel of barrelRedirectMap.keys()) {
  const rel = path.relative(PROJECT_ROOT, barrel)
  try {
    execSync(`git rm -f "${rel}"`, { stdio: 'pipe' })
  } catch {
    try {
      fs.unlinkSync(barrel)
    } catch (e) {
      console.error(`Could not delete ${rel}: ${e.message}`)
      continue
    }
  }
  deletedCount++
}
console.log(`Deleted ${deletedCount} barrel files`)

// Clean up empty directories within TARGET_ROOT
function removeEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return false
  let isEmpty = true
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const childEmpty = removeEmptyDirs(full)
      if (!childEmpty) isEmpty = false
    } else {
      isEmpty = false
    }
  }
  if (isEmpty && dir !== ROOT_ABS) {
    try {
      fs.rmdirSync(dir)
      console.log(`Removed empty dir: ${path.relative(PROJECT_ROOT, dir)}`)
      return true
    } catch {
      return false
    }
  }
  return isEmpty
}
removeEmptyDirs(ROOT_ABS)
