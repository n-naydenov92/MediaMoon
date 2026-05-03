import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getJobWithFiles } from '@/lib/meta/jobs'

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'job id is required' }, { status: 400 })
  }
  const job = await getJobWithFiles(id)
  if (!job) {
    return NextResponse.json({ error: 'job not found' }, { status: 404 })
  }
  return NextResponse.json({ job })
}
