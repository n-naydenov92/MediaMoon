import { del } from '@vercel/blob'

export const BLOB_PATH_PREFIX = 'meta-ads/launch'
export const BLOB_MAX_SIZE_BYTES = 200 * 1024 * 1024
export const BLOB_ALLOWED_CONTENT_TYPES = ['image/*', 'video/*'] as const

export function buildBlobPath(jobId: string, fileId: string, filename: string): string {
  return `${BLOB_PATH_PREFIX}/${jobId}/${fileId}-${sanitizeFilename(filename)}`
}

export async function downloadBlob(url: string): Promise<{
  readonly bytes: ArrayBuffer
  readonly mimeType: string
}> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Blob download failed: HTTP ${response.status}`)
  }
  const bytes = await response.arrayBuffer()
  const mimeType = response.headers.get('content-type') ?? 'application/octet-stream'
  return { bytes, mimeType }
}

export async function deleteBlob(url: string): Promise<void> {
  await del(url, { token: requireBlobToken() })
}

export function requireBlobToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN env var is not set')
  }
  return token
}

export function sanitizeFilename(filename: string): string {
  return filename
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .slice(0, 80)
}
