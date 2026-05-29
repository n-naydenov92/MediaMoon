import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { duplicateAdSet } from '@/lib/gateways/MetaAdsGateway'
import { resolveAccountTokenFromRequest } from '@/lib/meta/resolveBrandToken'

export const runtime = 'nodejs'
export const maxDuration = 30

interface DuplicateRequestBody {
  readonly adSetId?: string
  readonly newName?: string
  readonly status?: string
  readonly budgetType?: 'DAILY' | 'LIFETIME'
  readonly budgetMinorUnits?: number
  readonly startTime?: string
  readonly endTime?: string
  readonly targeting?: Record<string, unknown>
  readonly isDynamicCreative?: boolean
  readonly dsaBeneficiary?: string
  readonly dsaPayor?: string
  readonly optimizationGoal?: string
  readonly bidStrategy?: string
  readonly bidAmountMinorUnits?: number
  readonly destinationType?: string
  readonly promotedObject?: Record<string, unknown>
  readonly attributionSpec?: readonly { event_type: string; window_days: number }[]
}

function buildExtraUpdateFields(body: DuplicateRequestBody): URLSearchParams | undefined {
  const extra = new URLSearchParams()
  const { budgetType, budgetMinorUnits, startTime, endTime } = body

  if (typeof budgetMinorUnits === 'number' && Number.isFinite(budgetMinorUnits)) {
    if (budgetType === 'LIFETIME') {
      extra.set('lifetime_budget', String(Math.max(0, Math.round(budgetMinorUnits))))
      extra.set('daily_budget', '0')
    } else if (budgetType === 'DAILY') {
      extra.set('daily_budget', String(Math.max(0, Math.round(budgetMinorUnits))))
      extra.set('lifetime_budget', '0')
    }
  }

  if (typeof startTime === 'string' && startTime) {
    const ts = Date.parse(startTime)
    if (Number.isFinite(ts) && ts > Date.now()) {
      extra.set('start_time', startTime)
    }
  }
  if (typeof endTime === 'string' && endTime) {
    const ts = Date.parse(endTime)
    if (Number.isFinite(ts) && ts > Date.now()) {
      extra.set('end_time', endTime)
    }
  }
  if (body.targeting && typeof body.targeting === 'object') {
    extra.set('targeting', JSON.stringify(body.targeting))
  }
  if (typeof body.isDynamicCreative === 'boolean') {
    extra.set('is_dynamic_creative', String(body.isDynamicCreative))
  }
  if (typeof body.dsaBeneficiary === 'string') {
    extra.set('dsa_beneficiary', body.dsaBeneficiary)
  }
  if (typeof body.dsaPayor === 'string') {
    extra.set('dsa_payor', body.dsaPayor)
  }
  if (typeof body.optimizationGoal === 'string' && body.optimizationGoal) {
    extra.set('optimization_goal', body.optimizationGoal)
  }
  if (typeof body.bidStrategy === 'string' && body.bidStrategy) {
    extra.set('bid_strategy', body.bidStrategy)
  }
  if (typeof body.bidAmountMinorUnits === 'number' && Number.isFinite(body.bidAmountMinorUnits)) {
    extra.set('bid_amount', String(Math.max(0, Math.round(body.bidAmountMinorUnits))))
  }
  if (typeof body.destinationType === 'string' && body.destinationType) {
    extra.set('destination_type', body.destinationType)
  }
  if (body.promotedObject && typeof body.promotedObject === 'object') {
    extra.set('promoted_object', JSON.stringify(body.promotedObject))
  }
  if (Array.isArray(body.attributionSpec) && body.attributionSpec.length > 0) {
    extra.set('attribution_spec', JSON.stringify(body.attributionSpec))
  }

  return extra.size > 0 ? extra : undefined
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const resolved = resolveAccountTokenFromRequest(request)
  if (!resolved.ok) return resolved.response

  let body: DuplicateRequestBody
  try {
    body = (await request.json()) as DuplicateRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { adSetId, newName, status } = body
  if (
    typeof adSetId !== 'string' || !adSetId
    || typeof newName !== 'string' || !newName.trim()
  ) {
    return NextResponse.json({ error: 'adSetId and newName are required' }, { status: 400 })
  }

  const normalizedStatus: 'PAUSED' | 'ACTIVE' = status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'
  const extra = buildExtraUpdateFields(body)

  try {
    const result = await duplicateAdSet(resolved.token, adSetId, newName.trim(), normalizedStatus, extra)
    return NextResponse.json({ result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
