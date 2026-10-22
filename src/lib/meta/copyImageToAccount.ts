import { uploadImage } from '@/lib/gateways/MetaAdsGateway'

// Ad image hashes are per ad account, so an image that lives elsewhere — a library
// creative from another account, or a frame Meta generated for a video — is downloaded
// and uploaded into the target account to get a hash it can publish with.
export async function copyImageToAccount(token: string, accountId: string, url: string): Promise<string> {
  const { bytes, mime } = await downloadBytes(url)
  const filename = mime.includes('png') ? 'library-image.png' : 'library-image.jpg'
  const { hash } = await uploadImage(token, accountId, bytes, filename, mime)
  return hash
}

async function downloadBytes(url: string): Promise<{ bytes: ArrayBuffer; mime: string }> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download source media (HTTP ${response.status})`)
  }
  const mime = response.headers.get('content-type') ?? 'application/octet-stream'
  const bytes = await response.arrayBuffer()
  return { bytes, mime }
}
