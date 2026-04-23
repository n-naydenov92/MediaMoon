import googleTrends from 'google-trends-api'

/**
 * TrendsGateway — the only place in the codebase that knows about Google Trends.
 * Returns null on failure: trends are optional, the UI must not be blocked.
 */

const ONE_DAY_MS = 24 * 60 * 60 * 1000
const MAX_SCORE = 100

interface TrendPoint {
  value?: number[]
}

interface TrendsResponse {
  default?: {
    timelineData?: TrendPoint[]
  }
}

export async function getScore(keyword: string): Promise<number | null> {
  if (!keyword.trim()) {
    return null
  }
  try {
    const raw = await fetchTrends(keyword)
    return computeAverageScore(raw)
  } catch {
    return null
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function fetchTrends(keyword: string): Promise<TrendsResponse> {
  const startTime = new Date(Date.now() - ONE_DAY_MS)
  const json = await googleTrends.interestOverTime({ keyword, startTime })
  const parsed = JSON.parse(json) as unknown
  if (!isTrendsResponse(parsed)) {
    throw new Error('Unexpected trends payload shape')
  }
  return parsed
}

function computeAverageScore(response: TrendsResponse): number | null {
  const timeline = response.default?.timelineData ?? []
  if (timeline.length === 0) {
    return null
  }
  const values = timeline
    .map((p) => p.value?.[0])
    .filter((v): v is number => typeof v === 'number')
  if (values.length === 0) {
    return null
  }
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length
  return clamp(avg, 0, MAX_SCORE)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function isTrendsResponse(value: unknown): value is TrendsResponse {
  return typeof value === 'object' && value !== null
}
