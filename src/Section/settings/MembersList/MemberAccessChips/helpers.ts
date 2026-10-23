import type { MemberAccess, MemberAccessPlace } from '@/types/workspace'
import { SETTINGS_LABELS } from '../../labels'

const PLACE = SETTINGS_LABELS.place

/** "Creative Analyst · Market: Stoitchkov · BG" */
export function accessLabel({ roleName, place }: MemberAccess): string {
  return `${roleName} · ${placeLabel(place)}`
}

function placeLabel(place: MemberAccessPlace): string {
  switch (place.kind) {
    case 'workspace':
      return PLACE.workspace
    case 'brand':
      return `${PLACE.brand}: ${place.brandName}`
    case 'market':
      return `${PLACE.market}: ${place.brandName} · ${place.marketCode}`
  }
}
