import type { CtaType } from '@/lib/gateways/MetaAdsGateway'
import { MAX_IMAGE_BYTES, compressImageIfNeeded } from './imageProcessing'
import { postForm, postJson, withRetry } from './httpClient'

const META_THUMBNAIL_POLL_MS = 5_000
// A stop for processing that never finishes, not an estimate of how long it takes:
// the wait normally ends on Meta's own signal (frames ready, or processing failed).
const META_THUMBNAIL_MAX_WAIT_MS = 10 * 60_000
const META_THUMBNAIL_TIMEOUT_MESSAGE = 'Meta is still processing this video after 10 minutes. Retry later.'

export interface PublishPayload {
  readonly accountId: string
  readonly adSetId: string
  readonly pageId: string
  readonly instagramId: string
  readonly autoResolveInstagram: boolean
  readonly status: 'ACTIVE' | 'PAUSED'
  readonly copy: {
    readonly name: string
    readonly headline: string
    readonly body: string
    readonly description: string
    readonly url: string
    readonly cta: CtaType
  }
}

export interface PublishResult {
  readonly adId: string
  readonly creativeId: string
}

interface StartChunkedResponse {
  readonly mode: 'chunked'
  readonly uploadSessionId: string
  readonly videoId: string
  readonly startOffset: number
  readonly endOffset: number
  readonly maxChunkSize: number
}

interface StartSingleShotResponse {
  readonly mode: 'single-shot'
}

type StartResponse = StartChunkedResponse | StartSingleShotResponse

interface ChunkResponse {
  readonly startOffset: number
  readonly endOffset: number
}

interface FinalizeResponse {
  readonly videoId: string
}

type MetaThumbnailResponse =
  | { readonly status: 'processing' }
  | { readonly status: 'ready'; readonly thumbnailHash: string }

interface ImageUploadResponse {
  readonly imageHash: string
}

interface PublishResponse {
  readonly result: {
    readonly adId: string
    readonly creativeId: string
  }
}

export async function uploadVideoChunked(
  file: File,
  accountId: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const startResponse = await postJson<StartResponse>(
    `/api/meta-ads/upload/start?accountId=${encodeURIComponent(accountId)}`,
    { fileSize: file.size, mediaType: 'video' },
    signal,
  )
  if (startResponse.mode !== 'chunked') {
    throw new Error('Server returned unexpected upload mode for video')
  }
  const { uploadSessionId, videoId, maxChunkSize } = startResponse

  // Meta names the next byte range after every step and signals completion with an
  // empty range (start === end) — the same loop Meta's own SDK runs.
  let { startOffset, endOffset } = startResponse
  while (startOffset < endOffset) {
    const chunk = file.slice(startOffset, Math.min(endOffset, startOffset + maxChunkSize))
    const form = new FormData()
    form.append('uploadSessionId', uploadSessionId)
    form.append('startOffset', String(startOffset))
    form.append('chunk', chunk, 'chunk')
    const response = await withRetry(
      () => postForm<ChunkResponse>(
        `/api/meta-ads/upload/chunk?accountId=${encodeURIComponent(accountId)}`,
        form,
        signal,
      ),
    )
    startOffset = response.startOffset
    endOffset = response.endOffset
    onProgress(Math.min(100, (startOffset / file.size) * 100))
  }

  await postJson<FinalizeResponse>(
    `/api/meta-ads/upload/finalize?accountId=${encodeURIComponent(accountId)}`,
    { uploadSessionId, videoId },
    signal,
  )
  onProgress(100)
  return videoId
}

// Meta rejects a video creative without a thumbnail. When the browser couldn't take a
// frame, wait for Meta to process the uploaded video and use the frame it generates.
export async function waitForMetaThumbnail(
  videoId: string,
  accountId: string,
  signal?: AbortSignal,
): Promise<string> {
  const url = `/api/meta-ads/upload/video-thumbnail?accountId=${encodeURIComponent(accountId)}`
  const deadline = Date.now() + META_THUMBNAIL_MAX_WAIT_MS
  while (Date.now() < deadline) {
    const response = await withRetry(() => postJson<MetaThumbnailResponse>(url, { videoId }, signal))
    if (response.status === 'ready') {
      return response.thumbnailHash
    }
    await delay(META_THUMBNAIL_POLL_MS, signal)
  }
  throw new Error(META_THUMBNAIL_TIMEOUT_MESSAGE)
}

export async function uploadImageSingleShot(
  file: File,
  accountId: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const prepared = await compressImageIfNeeded(file, MAX_IMAGE_BYTES)
  onProgress(20)
  const form = new FormData()
  form.append('file', prepared, prepared.name)
  const response = await postForm<ImageUploadResponse>(
    `/api/meta-ads/upload/image?accountId=${encodeURIComponent(accountId)}`,
    form,
    signal,
  )
  onProgress(100)
  return response.imageHash
}

export interface MediaRef {
  readonly imageHash?: string
  readonly videoId?: string
  readonly thumbnailHash?: string
}

// Re-uploads an existing library creative into the target account (server-side
// download + upload), returning the account-local media reference to publish with.
export async function reuploadCreativeFromSource(
  asset: {
    readonly accountId: string
    readonly mediaType: 'image' | 'video'
    readonly imageUrl: string | null
    readonly videoId: string | null
    readonly thumbnailUrl: string | null
  },
  accountId: string,
  signal?: AbortSignal,
): Promise<MediaRef> {
  const url = `/api/meta-ads/reupload?accountId=${encodeURIComponent(accountId)}`
  if (asset.mediaType === 'image') {
    const res = await postJson<{ imageHash: string }>(
      url,
      { kind: 'image', imageUrl: asset.imageUrl },
      signal,
    )
    return { imageHash: res.imageHash }
  }
  // The source account is needed server-side to decide whether the video id can be
  // reused (same Business Manager) or is unusable (different BM).
  const res = await postJson<{ videoId: string; thumbnailHash: string }>(
    url,
    {
      kind: 'video',
      videoId: asset.videoId,
      thumbnailUrl: asset.thumbnailUrl,
      sourceAccountId: asset.accountId,
    },
    signal,
  )
  return { videoId: res.videoId, thumbnailHash: res.thumbnailHash }
}

export async function publishAd(
  payload: PublishPayload,
  media: {
    readonly imageHash?: string
    readonly videoId?: string
    readonly thumbnailHash?: string
  },
  signal?: AbortSignal,
): Promise<PublishResult> {
  const response = await postJson<PublishResponse>(
    `/api/meta-ads/publish?accountId=${encodeURIComponent(payload.accountId)}`,
    {
      adSetId: payload.adSetId,
      pageId: payload.pageId,
      headline: payload.copy.headline,
      bodyText: payload.copy.body,
      description: payload.copy.description || undefined,
      destinationUrl: payload.copy.url,
      ctaType: payload.copy.cta,
      adName: payload.copy.name,
      status: payload.status,
      instagramActorId: payload.instagramId || undefined,
      autoResolveInstagram: payload.autoResolveInstagram,
      imageHash: media.imageHash,
      videoId: media.videoId,
      thumbnailHash: media.thumbnailHash,
    },
    signal,
  )
  return response.result
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
}
