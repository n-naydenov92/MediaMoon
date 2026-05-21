import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { markFileUploaded } from '@/lib/meta/jobs'
import { BLOB_ALLOWED_CONTENT_TYPES, BLOB_MAX_SIZE_BYTES, requireBlobToken } from '@/lib/meta/blobStorage'

interface UploadTokenPayload {
  readonly fileId: string
  readonly jobId: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const result = await handleUpload({
      body,
      request,
      token: requireBlobToken(),
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const parsed = parseClientPayload(clientPayload)
        return {
          allowedContentTypes: [...BLOB_ALLOWED_CONTENT_TYPES],
          maximumSizeInBytes: BLOB_MAX_SIZE_BYTES,
          tokenPayload: JSON.stringify(parsed),
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        if (!tokenPayload) {
          return
        }
        const payload = JSON.parse(tokenPayload) as UploadTokenPayload
        await markFileUploaded(payload.fileId, blob.url)
      },
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

function parseClientPayload(raw: string | null): UploadTokenPayload {
  if (!raw) {
    throw new Error('clientPayload with { jobId, fileId } is required')
  }
  const parsed = JSON.parse(raw) as Partial<UploadTokenPayload>
  if (typeof parsed.jobId !== 'string' || typeof parsed.fileId !== 'string') {
    throw new Error('clientPayload must contain { jobId, fileId } strings')
  }
  return { jobId: parsed.jobId, fileId: parsed.fileId }
}
