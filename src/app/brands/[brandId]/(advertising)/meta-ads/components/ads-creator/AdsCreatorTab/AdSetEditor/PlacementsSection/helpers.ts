import type { PlacementSelection } from '@/lib/gateways/MetaAdsGateway'
import { PLACEMENT_CATALOG, type PlacementPlatform } from './catalog'

export function isAdvantagePlus(sourcePlacements: PlacementSelection | null): boolean {
  return sourcePlacements === null || sourcePlacements.mode === 'ADVANTAGE_PLUS'
}

export function placementsSubtitle(sourcePlacements: PlacementSelection | null): string {
  if (sourcePlacements === null) {
    return 'Meta auto-selects placements across all surfaces for best performance.'
  }
  if (sourcePlacements.mode === 'ADVANTAGE_PLUS') {
    return 'Copied from the source ad set. Meta auto-selects placements across all surfaces.'
  }
  return 'Copied from the source ad set. Manual placements are kept; Instagram Explore is always left out.'
}

export function visiblePlatforms(sourcePlacements: PlacementSelection | null): readonly PlacementPlatform[] {
  if (isAdvantagePlus(sourcePlacements)) {
    return PLACEMENT_CATALOG
  }
  const selected = sourcePlacements?.publisherPlatforms ?? []
  return PLACEMENT_CATALOG.filter((platform) => selected.includes(platform.id))
}
