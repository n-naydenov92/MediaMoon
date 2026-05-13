import Anthropic from '@anthropic-ai/sdk'
import type { RssArticle } from '@/types'

/**
 * ClusteringGateway — the only place in the codebase that knows about Claude.
 * Given N articles, returns clusters of articles that describe the same event.
 */

const MODEL = 'claude-sonnet-4-20250514'
const MAX_TOKENS = 4096
const MAX_RETRIES = 1

const SYSTEM_PROMPT =
  'You are a media analyst. Group news headlines that describe the same event into ' +
  'clusters. Respond with valid JSON only — no markdown, no commentary.'

interface ClaudeClusterResponse {
  clusters: {
    representative_title: string
    article_indexes: number[]
  }[]
}

export interface RawCluster {
  readonly representativeTitle: string
  readonly articles: readonly RssArticle[]
}

export async function cluster(articles: readonly RssArticle[]): Promise<readonly RawCluster[]> {
  if (articles.length === 0) {
    return []
  }
  const parsed = await callClaudeWithRetry(articles)
  return mapToRawClusters(parsed, articles)
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function callClaudeWithRetry(
  articles: readonly RssArticle[],
): Promise<ClaudeClusterResponse> {
  let lastError: unknown = null
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      return await callClaude(articles)
    } catch (err) {
      lastError = err
    }
  }
  throw new Error(
    `Clustering failed after ${MAX_RETRIES + 1} attempts: ${formatError(lastError)}`,
  )
}

async function callClaude(articles: readonly RssArticle[]): Promise<ClaudeClusterResponse> {
  const client = getClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(articles) }],
  })
  const text = extractText(response)
  return parseJson(text)
}

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  return new Anthropic({ apiKey })
}

function buildUserPrompt(articles: readonly RssArticle[]): string {
  const titles = articles.map((a, i) => ({ index: i, title: a.title, source: a.source }))
  return [
    'Group these headlines by the underlying event.',
    'Return JSON with this exact shape:',
    '{ "clusters": [{ "representative_title": string, "article_indexes": number[] }] }',
    '',
    'Headlines:',
    JSON.stringify(titles, null, 2),
  ].join('\n')
}

function extractText(response: Anthropic.Messages.Message): string {
  const [first] = response.content
  if (!first || first.type !== 'text') {
    throw new Error('Claude returned no text content')
  }
  return first.text
}

function parseJson(text: string): ClaudeClusterResponse {
  const cleaned = stripMarkdownFences(text)
  const parsed = JSON.parse(cleaned) as unknown
  if (!isValidResponse(parsed)) {
    throw new Error('Claude response did not match expected shape')
  }
  return parsed
}

function stripMarkdownFences(text: string): string {
  return text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
}

function isValidResponse(value: unknown): value is ClaudeClusterResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as { clusters?: unknown }
  if (!Array.isArray(candidate.clusters)) {
    return false
  }
  return candidate.clusters.every(isValidCluster)
}

function isValidCluster(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const c = value as { representative_title?: unknown; article_indexes?: unknown }
  return typeof c.representative_title === 'string' && Array.isArray(c.article_indexes)
}

function mapToRawClusters(
  response: ClaudeClusterResponse,
  articles: readonly RssArticle[],
): readonly RawCluster[] {
  return response.clusters.map((c) => ({
    representativeTitle: c.representative_title,
    articles: c.article_indexes
      .map((i) => articles[i])
      .filter((a): a is RssArticle => a !== undefined),
  }))
}

function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}
