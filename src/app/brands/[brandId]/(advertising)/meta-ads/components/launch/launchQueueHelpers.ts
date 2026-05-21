import type { CtaType } from '@/lib/gateways/MetaAdsGateway'

export interface PublishPayload {
  readonly accountId: string
  readonly adSetId: string
  readonly pageId: string
  readonly instagramId: string
  readonly copy: {
    readonly name: string
    readonly headline: string
    readonly body: string
    readonly url: string
    readonly cta: CtaType
  }
}

export interface PublishResult {
  readonly adId: string
  readonly creativeId: string
}

const MAX_IMAGE_BYTES = Math.floor(3.5 * 1024 * 1024)
const COMPRESSION_QUALITY_LADDER = [0.9, 0.7, 0.5, 0.3] as const
const MAX_IMAGE_DIMENSION = 1920

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
      destinationUrl: payload.copy.url,
      ctaType: payload.copy.cta,
      adName: payload.copy.name,
      instagramActorId: payload.instagramId || undefined,
      imageHash: media.imageHash,
      videoId: media.videoId,
      thumbnailHash: media.thumbnailHash,
    },
    signal,
  )
  return response.result
}

export async function extractVideoThumbnail(file: File): Promise<File> {
  if (typeof document === 'undefined') {
    throw new Error('Video thumbnail extraction requires a browser environment')
  }
  const url = URL.createObjectURL(file)
  try {
    const video = document.createElement('video')
    video.src = url
    video.muted = true
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'

    await new Promise<void>((resolve, reject) => {
      const onLoaded = (): void => { resolve() }
      const onError = (): void => { reject(new Error('Failed to load video for thumbnail extraction')) }
      video.addEventListener('loadedmetadata', onLoaded, { once: true })
      video.addEventListener('error', onError, { once: true })
    })

    const seekTarget = Number.isFinite(video.duration) && video.duration > 0
      ? Math.min(1, video.duration * 0.1)
      : 0
    video.currentTime = seekTarget

    await new Promise<void>((resolve, reject) => {
      const onSeeked = (): void => { resolve() }
      const onError = (): void => { reject(new Error('Failed to seek video')) }
      video.addEventListener('seeked', onSeeked, { once: true })
      video.addEventListener('error', onError, { once: true })
    })

    const longest = Math.max(video.videoWidth, video.videoHeight)
    if (longest === 0) {
      throw new Error('Video has zero dimensions; cannot extract thumbnail')
    }
    const scale = longest > MAX_IMAGE_DIMENSION ? MAX_IMAGE_DIMENSION / longest : 1
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Failed to get 2d canvas context')
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const blob = await canvasToBlob(canvas, 'image/jpeg', 0.85)
    const baseName = file.name.replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.thumbnail.jpg`, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressImageIfNeeded(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) {
    return file
  }
  if (typeof document === 'undefined') {
    throw new Error('Image compression requires a browser environment')
  }

  const bitmap = await loadImageBitmap(file)
  const { canvas, scale } = drawScaledToCanvas(bitmap, MAX_IMAGE_DIMENSION)
  bitmap.close?.()

  for (const quality of COMPRESSION_QUALITY_LADDER) {
    const blob = await canvasToBlob(canvas, 'image/jpeg', quality)
    if (blob.size <= maxBytes) {
      const baseName = file.name.replace(/\.[^.]+$/, '')
      return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
    }
  }
  throw new Error(
    `Image still exceeds ${maxBytes} bytes after compression (scale ${scale.toFixed(2)}). Resize manually.`,
  )
}

async function loadImageBitmap(file: File): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file)
  }
  throw new Error('createImageBitmap is not supported in this browser')
}

function drawScaledToCanvas(
  bitmap: ImageBitmap,
  maxDimension: number,
): { canvas: HTMLCanvasElement; scale: number } {
  const longest = Math.max(bitmap.width, bitmap.height)
  const scale = longest > maxDimension ? maxDimension / longest : 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Failed to get 2d canvas context')
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return { canvas, scale }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error('Canvas toBlob returned null'))
      }
    }, type, quality)
  })
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return (await response.json()) as T
}

async function postForm<T>(url: string, form: FormData, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { method: 'POST', body: form, signal })
  if (!response.ok) {
    throw new Error(await parseError(response))
  }
  return (await response.json()) as T
}

async function parseError(response: Response): Promise<string> {
  const fallback = `HTTP ${response.status}`
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? fallback
  } catch {
    return fallback
  }
}

const RETRY_BACKOFF_MS = [1000, 3000, 8000] as const

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  const delays: readonly (number | undefined)[] = [...RETRY_BACKOFF_MS, undefined]
  for (const delay of delays) {
    try {
      return await fn()
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      lastError = err
      if (delay !== undefined) {
        await sleep(delay)
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Retry exhausted')
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
