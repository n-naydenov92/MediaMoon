import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { CtaType } from '@prisma/client'
import { isBrandId } from '@/config/brands'
import { getBusinessManagerForAccount } from '@/config/metaBusinessManagers'
import { isValidMarket } from '@/lib/markets'
import { createJobWithFiles, type CreateJobInput } from '@/lib/meta/jobs'
import { BLOB_MAX_SIZE_BYTES } from '@/lib/meta/blobStorage'

const MAX_FILES_PER_JOB = 50
const ALLOWED_CTA_TYPES = new Set<CtaType>([CtaType.LEARN_MORE, CtaType.SHOP_NOW, CtaType.SIGN_UP])

interface CreateRequestBody {
  brandId?: unknown
  market?: unknown
  accountId?: unknown
  campaignId?: unknown
  adSetId?: unknown
  pageId?: unknown
  copy?: {
    headline?: unknown
    body?: unknown
    url?: unknown
    cta?: unknown
  }
  files?: unknown
}

interface FileMetaInput {
  readonly originalName: string
  readonly mimeType: string
  readonly sizeBytes: number
}

type ValidationResult =
  | { readonly ok: true; readonly input: CreateJobInput }
  | { readonly ok: false; readonly error: string }

export async function POST(request: NextRequest): Promise<NextResponse> {
  let raw: CreateRequestBody
  try {
    raw = (await request.json()) as CreateRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validate(raw)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }
  const { input } = validation

  const bm = getBusinessManagerForAccount(input.accountId)
  if (!bm) {
    return NextResponse.json({ error: `unknown accountId: ${input.accountId}` }, { status: 400 })
  }
  if (bm.brandId !== input.brandId) {
    return NextResponse.json(
      { error: `accountId ${input.accountId} does not belong to brand ${input.brandId}` },
      { status: 400 },
    )
  }

  try {
    const job = await createJobWithFiles(input)
    return NextResponse.json({
      jobId: job.id,
      batchNumber: job.batchNumber,
      files: job.files.map((f) => ({ id: f.id, originalName: f.originalName, mimeType: f.mimeType })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

function validate(raw: CreateRequestBody): ValidationResult {
  if (typeof raw.brandId !== 'string' || !isBrandId(raw.brandId)) {
    return { ok: false, error: 'brandId is required and must be a known brand' }
  }
  if (typeof raw.market !== 'string' || !isValidMarket(raw.market)) {
    return { ok: false, error: 'market is required and must be a known market' }
  }
  if (typeof raw.accountId !== 'string' || !raw.accountId.startsWith('act_')) {
    return { ok: false, error: 'accountId is required and must start with act_' }
  }
  if (typeof raw.campaignId !== 'string' || !raw.campaignId) {
    return { ok: false, error: 'campaignId is required' }
  }
  if (typeof raw.adSetId !== 'string' || !raw.adSetId) {
    return { ok: false, error: 'adSetId is required' }
  }
  if (typeof raw.pageId !== 'string' || !raw.pageId) {
    return { ok: false, error: 'pageId is required' }
  }
  const { copy } = raw
  if (
    !copy ||
    typeof copy.headline !== 'string' || !copy.headline ||
    typeof copy.body !== 'string' || !copy.body ||
    typeof copy.url !== 'string' || !copy.url ||
    typeof copy.cta !== 'string' || !ALLOWED_CTA_TYPES.has(copy.cta as CtaType)
  ) {
    return { ok: false, error: 'copy.{headline,body,url,cta} are required' }
  }
  if (!Array.isArray(raw.files) || raw.files.length === 0) {
    return { ok: false, error: 'files must be a non-empty array' }
  }
  if (raw.files.length > MAX_FILES_PER_JOB) {
    return { ok: false, error: `max ${MAX_FILES_PER_JOB} files per job` }
  }

  const fileMetas: FileMetaInput[] = []
  for (const f of raw.files) {
    const file = f as { originalName?: unknown; mimeType?: unknown; sizeBytes?: unknown }
    if (
      typeof file.originalName !== 'string' || !file.originalName ||
      typeof file.mimeType !== 'string' || !file.mimeType ||
      typeof file.sizeBytes !== 'number' || file.sizeBytes <= 0
    ) {
      return { ok: false, error: 'each file requires { originalName, mimeType, sizeBytes }' }
    }
    if (file.sizeBytes > BLOB_MAX_SIZE_BYTES) {
      return { ok: false, error: `file ${file.originalName} exceeds size limit` }
    }
    fileMetas.push({
      originalName: file.originalName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
    })
  }

  return {
    ok: true,
    input: {
      brandId: raw.brandId,
      market: raw.market,
      accountId: raw.accountId,
      campaignId: raw.campaignId,
      adSetId: raw.adSetId,
      pageId: raw.pageId,
      copy: {
        headline: copy.headline,
        body: copy.body,
        url: copy.url,
        cta: copy.cta as CtaType,
      },
      files: fileMetas,
    },
  }
}
