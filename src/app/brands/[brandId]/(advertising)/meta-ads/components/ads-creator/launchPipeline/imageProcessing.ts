export const MAX_IMAGE_BYTES = Math.floor(3.5 * 1024 * 1024)
const COMPRESSION_QUALITY_LADDER = [0.9, 0.7, 0.5, 0.3] as const
const MAX_IMAGE_DIMENSION = 1920

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
      const onLoaded = (): void => {
        resolve()
      }
      const onError = (): void => {
        reject(new Error('Failed to load video for thumbnail extraction'))
      }
      video.addEventListener('loadedmetadata', onLoaded, { once: true })
      video.addEventListener('error', onError, { once: true })
    })

    const seekTarget = Number.isFinite(video.duration) && video.duration > 0
      ? Math.min(1, video.duration * 0.1)
      : 0
    video.currentTime = seekTarget

    await new Promise<void>((resolve, reject) => {
      const onSeeked = (): void => {
        resolve()
      }
      const onError = (): void => {
        reject(new Error('Failed to seek video'))
      }
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
