import type { CreateRequestPayload, DuplicateRequestPayload } from './helpers'

interface MutationResponse {
  readonly result?: { readonly adSetId: string }
  readonly error?: string
}

// Shared POST for both create and duplicate — returns the new ad set id or throws.
export async function postAdSet(
  url: string,
  payload: CreateRequestPayload | DuplicateRequestPayload,
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = (await response.json().catch(() => ({}))) as MutationResponse
  if (!response.ok || !json.result) {
    throw new Error(json.error ?? `HTTP ${response.status}`)
  }
  return json.result.adSetId
}
