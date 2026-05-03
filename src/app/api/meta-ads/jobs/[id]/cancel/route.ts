import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cancelQueuedFilesForJob } from '@/lib/meta/jobs'

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>
}

export async function POST(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'job id is required' }, { status: 400 })
  }
  await cancelQueuedFilesForJob(id)
  return NextResponse.json({ ok: true })
}
