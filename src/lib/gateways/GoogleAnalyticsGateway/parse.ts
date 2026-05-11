import type { DeviceCategory } from '@/types/dashboard'

export function parseDevice(raw: string | null | undefined): DeviceCategory | null {
  if (!raw) {
    return null
  }
  const lower = raw.toLowerCase()
  if (lower === 'mobile' || lower === 'desktop' || lower === 'tablet') {
    return lower
  }
  return null
}

export function formatGaDate(raw: string | null | undefined): string | null {
  if (!raw || raw.length !== 8) {
    return null
  }
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

export function parseInteger(raw: string | null | undefined): number {
  if (!raw) {
    return 0
  }
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

export function parseRatio(raw: string | null | undefined): number | null {
  if (!raw) {
    return null
  }
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseFloatSafe(raw: string | null | undefined): number {
  if (!raw) {
    return 0
  }
  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : 0
}
