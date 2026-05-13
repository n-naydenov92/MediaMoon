#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

function findMatching(content, openIdx, openChar, closeChar) {
  let depth = 1
  let i = openIdx + 1
  let inString = null
  let inComment = null
  while (i < content.length) {
    const c = content[i]
    const next = content[i + 1]
    if (inComment === 'line') {
      if (c === '\n') inComment = null
    } else if (inComment === 'block') {
      if (c === '*' && next === '/') { inComment = null; i++ }
    } else if (inString) {
      if (c === '\\') { i += 2; continue }
      if (c === inString) inString = null
    } else {
      if (c === '/' && next === '/') { inComment = 'line'; i++ }
      else if (c === '/' && next === '*') { inComment = 'block'; i++ }
      else if (c === '"' || c === "'" || c === '`') inString = c
      else if (c === openChar) depth++
      else if (c === closeChar) {
        depth--
        if (depth === 0) return i
      }
    }
    i++
  }
  return -1
}

function isWS(c) { return c === ' ' || c === '\n' || c === '\t' || c === '\r' }

function transformMemoCall(content, memoIdx, name) {
  const after = memoIdx + 5
  if (content[after] !== '(') return null
  const closeParen = findMatching(content, after, '(', ')')
  if (closeParen === -1) return null
  let j = closeParen + 1
  while (j < content.length && isWS(content[j])) j++
  let retType = ''
  if (content[j] === ':') {
    const arrowPos = content.indexOf('=>', j)
    if (arrowPos === -1) return null
    retType = content.slice(j, arrowPos)
    j = arrowPos
  }
  if (content.slice(j, j + 2) !== '=>') return null
  let bodyStart = j + 2
  while (bodyStart < content.length && isWS(content[bodyStart])) bodyStart++
  const bodyOpen = content[bodyStart]
  if (bodyOpen !== '(' && bodyOpen !== '{') return null
  const closeBody = findMatching(content, bodyStart, bodyOpen, bodyOpen === '(' ? ')' : '}')
  if (closeBody === -1) return null

  const params = content.slice(after, closeParen + 1)
  const bodyContent = content.slice(bodyStart + 1, closeBody)

  let newBody
  if (bodyOpen === '(') {
    newBody = `{\n  return (${bodyContent})\n}`
  } else {
    newBody = `{${bodyContent}}`
  }
  const retTypeStr = retType ? retType.replace(/\s+$/, '') : ''
  const replacement = `function ${name}${params}${retTypeStr} ${newBody}`
  return {
    start: after,
    end: closeBody + 1,
    replacement,
  }
}

function transformBottomStyle(content) {
  const exportRegex = /export default memo\(([A-Z][A-Za-z0-9_]*)\)/
  const m = content.match(exportRegex)
  if (!m) return content
  const name = m[1]

  const fnDeclMatch = content.match(new RegExp(`^function\\s+${name}\\b`, 'm'))
  if (!fnDeclMatch || fnDeclMatch.index === undefined) return content
  const fnDeclStart = fnDeclMatch.index

  let i = fnDeclStart
  while (i < content.length && content[i] !== '(') i++
  if (i >= content.length) return content
  const paramsClose = findMatching(content, i, '(', ')')
  if (paramsClose === -1) return content

  let j = paramsClose + 1
  while (j < content.length && isWS(content[j])) j++
  let retType = ''
  if (content[j] === ':') {
    const bodyOpenSearch = content.indexOf('{', j)
    if (bodyOpenSearch === -1) return content
    retType = content.slice(j, bodyOpenSearch).replace(/\s+$/, '')
    j = bodyOpenSearch
  }
  while (j < content.length && isWS(content[j])) j++
  if (content[j] !== '{') return content
  const bodyClose = findMatching(content, j, '{', '}')
  if (bodyClose === -1) return content

  const params = content.slice(i, paramsClose + 1)
  const body = content.slice(j, bodyClose + 1)
  const inlineExpr = `function ${name}${params}${retType ? ` ${retType}` : ''} ${body}`

  const before = content.slice(0, fnDeclStart)
  const after = content.slice(bodyClose + 1).replace(/^\s*\n+/, '\n')
  const trimmedBefore = before.replace(/\n+$/, '\n')
  let result = trimmedBefore + after.replace(/^\n/, '')

  result = result.replace(
    new RegExp(`export default memo\\(${name}\\)`),
    `export default memo(${inlineExpr})`,
  )
  return result
}

function transformFile(filePath) {
  const fileName = path.basename(filePath, '.tsx')
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  let i = 0
  while (i < content.length) {
    const next = content.indexOf('memo(', i)
    if (next === -1) break

    const before = content.slice(0, next).trimEnd()
    let name = null
    if (before.endsWith('export default')) {
      name = fileName
    } else {
      const constMatch = before.match(/const\s+([A-Z][A-Za-z0-9_]*)\s*=\s*$/)
      if (constMatch) name = constMatch[1]
    }

    if (!name) { i = next + 5; continue }

    const result = transformMemoCall(content, next, name)
    if (!result) { i = next + 5; continue }

    content = content.slice(0, result.start) + result.replacement + content.slice(result.end)
    i = result.start + result.replacement.length
  }

  content = transformBottomStyle(content)

  if (content !== original) {
    fs.writeFileSync(filePath, content)
    return true
  }
  return false
}

const files = process.argv.slice(2)
let changed = 0
for (const f of files) {
  try {
    if (transformFile(f)) {
      changed++
      console.log(`changed ${f}`)
    }
  } catch (err) {
    console.error(`ERROR ${f}: ${err.message}`)
  }
}
console.log(`\n${changed} files transformed`)
