import type { CtaType } from '@/lib/gateways/MetaAdsGateway'
import { MAX_IMAGE_BYTES, compressImageIfNeeded } from './imageProcessing'
import { postForm, postJson, withRetry } from './httpClient'

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
  readonly chunkSize: number
}

interface StartSingleShotResponse {
  readonly mode: 'single-shot'
  readonly chunkSize: number
}

type StartResponse = StartChunkedResponse | StartSingleShotResponse

interface ChunkResponse {
  readonly startOffset: number
  readonly endOffset: number
  readonly complete: boolean
}

interface FinalizeResponse {
  readonly videoId: string
}

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
  const { uploadSessionId, videoId, chunkSize } = startResponse

  let offset = 0
  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size)
    const chunk = file.slice(offset, end)
    const form = new FormData()
    form.append('uploadSessionId', uploadSessionId)
    form.append('startOffset', String(offset))
    form.append('chunk', chunk, 'chunk')
    const response = await withRetry(
      () => postForm<ChunkResponse>(
        `/api/meta-ads/upload/chunk?accountId=${encodeURIComponent(accountId)}`,
        form,
        signal,
      ),
    )
    offset = response.startOffset
    onProgress(Math.min(100, (offset / file.size) * 100))
    if (response.complete) {
      break
    }
  }

  await postJson<FinalizeResponse>(
    `/api/meta-ads/upload/finalize?accountId=${encodeURIComponent(accountId)}`,
    { uploadSessionId, videoId },
    signal,
  )
  onProgress(100)
  return videoId
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
