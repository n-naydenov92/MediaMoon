import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isBrandId } from '@/config/brands'
import { listRecentJobsForBrand } from '@/lib/meta/jobs'

const DEFAULT_LIMIT = 30

export async function GET(request: NextRequest): Promise<NextResponse> {
  const brandIdRaw = request.nextUrl.searchParams.get('brandId')
  if (!brandIdRaw) {
    return NextResponse.json({ error: 'brandId query param is required' }, { status: 400 })
  }
  if (!isBrandId(brandIdRaw)) {
    return NextResponse.json({ error: `unknown brandId: ${brandIdRaw}` }, { status: 400 })
  }
  const jobs = await listRecentJobsForBrand(brandIdRaw, DEFAULT_LIMIT)
  return NextResponse.json({ jobs })
}
