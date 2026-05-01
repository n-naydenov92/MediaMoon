import { NextResponse, type NextRequest } from 'next/server'
import { getNewsForBrandMarket } from '@/lib/pipeline'
import { isValidationError, validateBrandMarket } from '@/Section/trending-news/api/validators'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const result = validateBrandMarket(searchParams.get('brandId'), searchParams.get('market'))
  if (isValidationError(result)) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  try {
    const data = await getNewsForBrandMarket({ topic: result.topic, market: result.market })
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
