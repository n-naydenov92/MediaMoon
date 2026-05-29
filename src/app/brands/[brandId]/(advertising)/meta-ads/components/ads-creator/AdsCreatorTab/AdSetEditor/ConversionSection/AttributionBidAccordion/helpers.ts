import type { AttributionEventType, AttributionWindow } from '@/lib/gateways/MetaAdsGateway'

export function getWindowDays(
  spec: readonly AttributionWindow[],
  eventType: AttributionEventType,
): number {
  const match = spec.find((w) => w.eventType === eventType)
  return match ? match.windowDays : 0
}

export function setWindowDays(
  spec: readonly AttributionWindow[],
  eventType: AttributionEventType,
  days: number,
): readonly AttributionWindow[] {
  const without = spec.filter((w) => w.eventType !== eventType)
  if (days <= 0) return without
  return [...without, { eventType, windowDays: days }]
}
