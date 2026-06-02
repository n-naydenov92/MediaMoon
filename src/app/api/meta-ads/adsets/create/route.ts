import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdSet } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

interface CreateRequestBody {
  readonly accountId?: string
  readonly campaignId?: string
  readonly name?: string
  readonly budgetType?: 'DAILY' | 'LIFETIME'
  readonly budgetMinorUnits?: number
  readonly startTime?: string
  readonly endTime?: string
  readonly targeting?: Record<string, unknown>
  readonly isDynamicCreative?: boolean
  readonly dsaBeneficiary?: string
  readonly dsaPayor?: string
  readonly optimizationGoal?: string
  readonly billingEvent?: string
  readonly bidStrategy?: string
  readonly bidAmountMinorUnits?: number
  readonly destinationType?: string
  readonly promotedObject?: Record<string, unknown>
  readonly attributionSpec?: readonly { event_type: string; window_days: number }[]
}

function buildCreateFields(body: CreateRequestBody): URLSearchParams {
  const fields = new URLSearchParams()
  fields.set('campaign_id', body.campaignId ?? '')
  fields.set('name', (body.name ?? '').trim())
  fields.set('optimization_goal', body.optimizationGoal ?? '')
  fields.set('billing_event', body.billingEvent ?? 'IMPRESSIONS')

  if (typeof body.budgetMinorUnits === 'number' && Number.isFinite(body.budgetMinorUnits)) {
    const cents = String(Math.max(0, Math.round(body.budgetMinorUnits)))
    if (body.budgetType === 'LIFETIME') {
      fields.set('lifetime_budget', cents)
    } else {
      fields.set('daily_budget', cents)
    }
  }

  if (typeof body.startTime === 'string' && body.startTime) {
    fields.set('start_time', body.startTime)
  }
  if (typeof body.endTime === 'string' && body.endTime) {
    fields.set('end_time', body.endTime)
  }
  if (body.targeting && typeof body.targeting === 'object') {
    fields.set('targeting', JSON.stringify(body.targeting))
  }
  if (typeof body.isDynamicCreative === 'boolean') {
    fields.set('is_dynamic_creative', String(body.isDynamicCreative))
  }
  if (typeof body.dsaBeneficiary === 'string' && body.dsaBeneficiary) {
    fields.set('dsa_beneficiary', body.dsaBeneficiary)
  }
  if (typeof body.dsaPayor === 'string' && body.dsaPayor) {
    fields.set('dsa_payor', body.dsaPayor)
  }
  if (typeof body.bidStrategy === 'string' && body.bidStrategy) {
    fields.set('bid_strategy', body.bidStrategy)
  }
  if (typeof body.bidAmountMinorUnits === 'number' && body.bidAmountMinorUnits > 0) {
    fields.set('bid_amount', String(Math.round(body.bidAmountMinorUnits)))
  }
  if (typeof body.destinationType === 'string' && body.destinationType) {
    fields.set('destination_type', body.destinationType)
  }
  if (body.promotedObject && typeof body.promotedObject === 'object') {
    fields.set('promoted_object', JSON.stringify(body.promotedObject))
  }
  if (Array.isArray(body.attributionSpec) && body.attributionSpec.length > 0) {
    fields.set('attribution_spec', JSON.stringify(body.attributionSpec))
  }
  return fields
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) {
    return resolved.response
  }

  let body: CreateRequestBody
  try {
    body = (await request.json()) as CreateRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { campaignId, name, optimizationGoal } = body
  if (
    typeof campaignId !== 'string' || !campaignId
    || typeof name !== 'string' || !name.trim()
    || typeof optimizationGoal !== 'string' || !optimizationGoal
  ) {
    return NextResponse.json(
      { error: 'campaignId, name, and optimizationGoal are required' },
      { status: 400 },
    )
  }

  const fields = buildCreateFields(body)

  try {
    const result = await createAdSet(resolved.token, resolved.accountId, fields)
    return NextResponse.json({ result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
