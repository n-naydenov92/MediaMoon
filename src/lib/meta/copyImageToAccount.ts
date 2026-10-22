import { uploadImage } from '@/lib/gateways/MetaAdsGateway'

// The source URL can come from the client, so only Meta's own media CDN is fetched —
// anything else would let a caller make the server request arbitrary hosts (SSRF).
const META_MEDIA_HOST_SUFFIXES = ['.fbcdn.net', '.fbsbx.com'] as const
// Meta's own upper limit for an ad image; anything larger can't be uploaded anyway.
const MAX_SOURCE_MEDIA_BYTES = 30 * 1024 * 1024

// Ad image hashes are per ad account, so an image that lives elsewhere — a library
// creative from another account, or a frame Meta generated for a video — is downloaded
// and uploaded into the target account to get a hash it can publish with.
export async function copyImageToAccount(token: string, accountId: string, url: string): Promise<string> {
  const { bytes, mime } = await downloadBytes(toMetaMediaUrl(url))
  const filename = mime.includes('png') ? 'library-image.png' : 'library-image.jpg'
  const { hash } = await uploadImage(token, accountId, bytes, filename, mime)
  return hash
}

function toMetaMediaUrl(raw: string): URL {
  const url = URL.canParse(raw) ? new URL(raw) : null
  if (!url || !isMetaMediaUrl(url)) {
    throw new Error('Source media must be an https URL on Meta’s media CDN')
  }
  return url
}

function isMetaMediaUrl(url: URL): boolean {
  const isMetaHost = META_MEDIA_HOST_SUFFIXES.some((suffix) => url.hostname.endsWith(suffix))
  const hasNoExtras = url.port === '' && url.username === '' && url.password === ''
  return url.protocol === 'https:' && isMetaHost && hasNoExtras
}

async function downloadBytes(url: URL): Promise<{ bytes: ArrayBuffer; mime: string }> {
  // A redirect could lead off the allowed hosts, so it is refused rather than followed.
  const response = await fetch(url, { redirect: 'error' })
  if (!response.ok) {
    throw new Error(`Failed to download source media (HTTP ${response.status})`)
  }
  assertWithinSizeLimit(Number(response.headers.get('content-length') ?? 0))
  const bytes = await response.arrayBuffer()
  assertWithinSizeLimit(bytes.byteLength)
  const mime = response.headers.get('content-type') ?? 'application/octet-stream'
  return { bytes, mime }
}

function assertWithinSizeLimit(byteCount: number): void {
  if (byteCount > MAX_SOURCE_MEDIA_BYTES) {
    throw new Error('Source media is larger than Meta accepts')
  }
}
