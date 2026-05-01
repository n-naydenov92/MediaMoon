import { NextResponse } from 'next/server'
import { fetchAdAccounts } from '@/lib/gateways/MetaAdsGateway'

export async function GET(): Promise<NextResponse> {
  try {
    const accounts = await fetchAdAccounts()
    return NextResponse.json({ accounts })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
