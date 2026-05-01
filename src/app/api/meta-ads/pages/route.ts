import { NextResponse } from 'next/server'
import { fetchPages } from '@/lib/gateways/MetaAdsGateway'

export async function GET(): Promise<NextResponse> {
  try {
    const pages = await fetchPages()
    return NextResponse.json({ pages })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
