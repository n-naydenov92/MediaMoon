import type { Market, NewsResult } from '@/types'

interface FetchParams {
  readonly brandId: string
  readonly market: Market
  readonly force: boolean
}

export async function fetchNews({ brandId, market, force }: FetchParams): Promise<NewsResult> {
  if (force) {
    const res = await fetch('/api/modules/trending-news/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ brandId, market }),
    })
    return handleResponse(res)
  }
  const url = `/api/modules/trending-news?brandId=${encodeURIComponent(brandId)}&market=${market}`
  const res = await fetch(url)
  return handleResponse(res)
}

async function handleResponse(res: Response): Promise<NewsResult> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `Request failed: ${res.status}`)
  }
  return (await res.json()) as NewsResult
}
