export type ChannelKind = 'campaigns' | 'flows'

export function clampPercent(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0
  }
  return value >= 100 ? 100 : value
}
