import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { FileStatus } from '@prisma/client'
import { getJobWithFiles } from '@/lib/meta/jobs'
import { inngest, META_ADS_PUBLISH_EVENT } from '@/inngest/client'

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'job id is required' }, { status: 400 })
  }

  const job = await getJobWithFiles(id)
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 })
  }

  const allUploaded = job.files.every((f) => f.status === FileStatus.UPLOADED)
  if (!allUploaded) {
    return NextResponse.json(
      { error: 'not all files have finished uploading to Blob storage' },
      { status: 409 },
    )
  }

  await inngest.send({
    name: META_ADS_PUBLISH_EVENT,
    data: { jobId: job.id, accountId: job.accountId },
  })

  return NextResponse.json({ ok: true })
}
