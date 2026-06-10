export const MAX_IMAGE_BYTES = Math.floor(3.5 * 1024 * 1024)
const COMPRESSION_QUALITY_LADDER = [0.9, 0.7, 0.5, 0.3] as const
const MAX_IMAGE_DIMENSION = 1920
const THUMBNAIL_STEP_TIMEOUT_MS = 15000

// Wait for a one-shot video event, but never hang: reject on the element's `error`
// event, on the caller's abort signal, or after `timeoutMs`. Browsers cap concurrent
// `<video>` decoders per renderer process, so `loadedmetadata`/`seeked` can silently
// never fire (and never `error`) when many videos decode at once — the timeout/abort
// is the only escape from that.
function waitForVideoEvent(
  video: HTMLVideoElement,
  event: 'loadedmetadata' | 'seeked',
  signal: AbortSignal | undefined,
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Thumbnail extraction aborted'))
      return
    }
    const cleanup = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    const settle = (action: () => void): void => {
      clearTimeout(timer)
      cleanup.abort()
      action()
    }
    timer = setTimeout(
      () => settle(() => reject(new Error(`Timed out waiting for video "${event}"`))),
      THUMBNAIL_STEP_TIMEOUT_MS,
    )
    const opts = { once: true, signal: cleanup.signal }
    video.addEventListener(event, () => settle(resolve), opts)
    video.addEventListener('error', () => settle(() => reject(new Error(`Video "${event}" failed`))), opts)
    signal?.addEventListener('abort', () => settle(() => reject(new Error('Thumbnail extraction aborted'))), opts)
  })
}

export async function extractVideoThumbnail(file: File, signal?: AbortSignal): Promise<File> {
  if (typeof document === 'undefined') {
    throw new Error('Video thumbnail extraction requires a browser environment')
  }
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  try {
    video.src = url
    video.muted = true
    video.preload = 'metadata'
    video.crossOrigin = 'anonymous'

    await waitForVideoEvent(video, 'loadedmetadata', signal)

    const seekTarget = Number.isFinite(video.duration) && video.duration > 0
      ? Math.min(1, video.duration * 0.1)
      : 0
    // Setting currentTime to its existing value doesn't fire `seeked`; skip the wait
    // so we don't hang on a no-op seek (the timeout would otherwise fail a fine video).
    if (seekTarget !== video.currentTime) {
      video.currentTime = seekTarget
      await waitForVideoEvent(video, 'seeked', signal)
    }

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
    // Release the media element's decoder promptly so concurrent extractions aren't
    // starved of the browser's limited decoder pool.
    video.removeAttribute('src')
    video.load()
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
