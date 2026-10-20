import type { CtaType } from '@/lib/gateways/MetaAdsGateway'
import { MAX_IMAGE_BYTES, compressImageIfNeeded, extractVideoThumbnail } from './imageProcessing'
import { postForm, postJson, withRetry } from './httpClient'

// The video upload owns most of a video job's progress bar; the rest is publishing.
const VIDEO_PROGRESS_SHARE = 0.95
const LIBRARY_ASSET_PROGRESS = 50
const IMAGE_PREPARED_PROGRESS = 20
const COMPLETE_PROGRESS = 100

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

export interface MediaRef {
  readonly imageHash?: string
  readonly videoId?: string
  readonly thumbnailHash?: string
}

// Where a chunked video upload stands, so an upload interrupted by Meta's rate limit
// (or a manual stop) continues from the last accepted chunk instead of starting over.
export interface VideoUploadCheckpoint {
  readonly uploadSessionId: string
  readonly videoId: string
  readonly offset: number
  readonly chunkSize: number
}

export interface MediaUploadJob {
  readonly checkpoint: VideoUploadCheckpoint | null
  readonly onCheckpoint: (checkpoint: VideoUploadCheckpoint) => void
  readonly onProgress: (percent: number) => void
}

interface LibraryAssetSource {
  readonly accountId: string
  readonly mediaType: 'image' | 'video'
  readonly imageUrl: string | null
  readonly videoId: string | null
  readonly thumbnailUrl: string | null
}

export type UploadSource =
  | { readonly kind: 'file'; readonly file: File }
  | { readonly kind: 'asset'; readonly asset: LibraryAssetSource }

interface UploadTarget {
  readonly source: UploadSource
  readonly accountId: string
  readonly signal: AbortSignal
}

interface ChunkedUploadOptions extends MediaUploadJob {
  readonly file: File
  readonly accountId: string
  readonly signal?: AbortSignal
}

interface ChunkTransfer {
  readonly file: File
  readonly accountId: string
  readonly session: VideoUploadCheckpoint
  readonly offset: number
  readonly signal?: AbortSignal
}

export interface PublishRequest {
  readonly payload: PublishPayload
  readonly media: MediaRef
  // Set when an earlier attempt created the creative but failed on the ad step.
  readonly creativeId: string | null
}

type UploadStep = 'start' | 'chunk' | 'finalize' | 'image'

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

export async function uploadCreativeMedia(target: UploadTarget, job: MediaUploadJob): Promise<MediaRef> {
  const { source, accountId, signal } = target
  if (source.kind === 'asset') {
    job.onProgress(LIBRARY_ASSET_PROGRESS)
    return reuploadCreativeFromSource(source.asset, accountId, signal)
  }
  if (!source.file.type.startsWith('video/')) {
    return { imageHash: await uploadImageSingleShot(source.file, accountId, job.onProgress, signal) }
  }
  const thumbnailFile = await extractVideoThumbnail(source.file, signal)
  const [videoId, thumbnailHash] = await Promise.all([
    uploadVideoChunked({
      ...job,
      file: source.file,
      accountId,
      signal,
      onProgress: (percent: number) => job.onProgress(percent * VIDEO_PROGRESS_SHARE),
    }),
    uploadImageSingleShot(thumbnailFile, accountId, () => {}, signal),
  ])
  return { videoId, thumbnailHash }
}

export async function uploadVideoChunked(options: ChunkedUploadOptions): Promise<string> {
  const { file, accountId, onCheckpoint, onProgress, signal } = options
  const session = options.checkpoint ?? await startVideoSession(file, accountId, signal)
  onCheckpoint(session)

  let { offset } = session
  while (offset < file.size) {
    const response = await transferChunk({ file, accountId, session, offset, signal })
    offset = response.startOffset
    onCheckpoint({ ...session, offset })
    onProgress(Math.min(COMPLETE_PROGRESS, (offset / file.size) * COMPLETE_PROGRESS))
    if (response.complete) {
      break
    }
  }

  await withRetry(() => postJson<FinalizeResponse>(
    uploadUrl('finalize', accountId),
    { uploadSessionId: session.uploadSessionId, videoId: session.videoId },
    signal,
  ))
  onProgress(COMPLETE_PROGRESS)
  return session.videoId
}

export async function uploadImageSingleShot(
  file: File,
  accountId: string,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<string> {
  const prepared = await compressImageIfNeeded(file, MAX_IMAGE_BYTES)
  onProgress(IMAGE_PREPARED_PROGRESS)
  const form = new FormData()
  form.append('file', prepared, prepared.name)
  const response = await withRetry(() => postForm<ImageUploadResponse>(uploadUrl('image', accountId), form, signal))
  onProgress(COMPLETE_PROGRESS)
  return response.imageHash
}

// Re-uploads an existing library creative into the target account (server-side
// download + upload), returning the account-local media reference to publish with.
export async function reuploadCreativeFromSource(
  asset: LibraryAssetSource,
  accountId: string,
  signal?: AbortSignal,
): Promise<MediaRef> {
  const url = `/api/meta-ads/reupload?accountId=${encodeURIComponent(accountId)}`
  if (asset.mediaType === 'image') {
    const res = await withRetry(() => postJson<{ imageHash: string }>(
      url,
      { kind: 'image', imageUrl: asset.imageUrl },
      signal,
    ))
    return { imageHash: res.imageHash }
  }
  // The source account is needed server-side to decide whether the video id can be
  // reused (same Business Manager) or is unusable (different BM).
  const res = await withRetry(() => postJson<{ videoId: string; thumbnailHash: string }>(
    url,
    {
      kind: 'video',
      videoId: asset.videoId,
      thumbnailUrl: asset.thumbnailUrl,
      sourceAccountId: asset.accountId,
    },
    signal,
  ))
  return { videoId: res.videoId, thumbnailHash: res.thumbnailHash }
}

// Never retried automatically: if the first attempt reached Meta, a repeat would
// publish the same ad twice.
export async function publishAd(request: PublishRequest, signal?: AbortSignal): Promise<PublishResult> {
  const { payload, media, creativeId } = request
  // TEMP DIAGNOSTIC (ad set mix-up): the ad set id on the wire, per ad.
  // eslint-disable-next-line no-console -- temporary ad set mix-up diagnostic
  console.info('[AdSetCheck] publish request sent', { adSetId: payload.adSetId, adName: payload.copy.name })
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
      creativeId: creativeId ?? undefined,
    },
    signal,
  )
  return response.result
}

async function startVideoSession(
  file: File,
  accountId: string,
  signal?: AbortSignal,
): Promise<VideoUploadCheckpoint> {
  const start = await withRetry(() => postJson<StartResponse>(
    uploadUrl('start', accountId),
    { fileSize: file.size, mediaType: 'video' },
    signal,
  ))
  if (start.mode !== 'chunked') {
    throw new Error('Server returned unexpected upload mode for video')
  }
  return { uploadSessionId: start.uploadSessionId, videoId: start.videoId, offset: 0, chunkSize: start.chunkSize }
}

function transferChunk({ file, accountId, session, offset, signal }: ChunkTransfer): Promise<ChunkResponse> {
  const form = new FormData()
  form.append('uploadSessionId', session.uploadSessionId)
  form.append('startOffset', String(offset))
  form.append('chunk', file.slice(offset, Math.min(offset + session.chunkSize, file.size)), 'chunk')
  return withRetry(() => postForm<ChunkResponse>(uploadUrl('chunk', accountId), form, signal))
}

function uploadUrl(step: UploadStep, accountId: string): string {
  return `/api/meta-ads/upload/${step}?accountId=${encodeURIComponent(accountId)}`
}
