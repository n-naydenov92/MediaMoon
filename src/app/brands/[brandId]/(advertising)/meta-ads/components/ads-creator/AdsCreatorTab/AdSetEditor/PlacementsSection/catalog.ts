export type DeviceCompat = 'mobile' | 'desktop' | 'both'

export interface PlacementPosition {
  readonly id: string
  readonly label: string
  readonly devices: DeviceCompat
}

export interface PlacementPlatform {
  readonly id: 'facebook' | 'instagram' | 'audience_network' | 'messenger'
  readonly label: string
  readonly positions: readonly PlacementPosition[]
}

export const PLACEMENT_CATALOG: readonly PlacementPlatform[] = [
  {
    id: 'facebook',
    label: 'Facebook',
    positions: [
      { id: 'feed', label: 'Feed', devices: 'both' },
      { id: 'profile_feed', label: 'Profile feed', devices: 'both' },
      { id: 'marketplace', label: 'Marketplace', devices: 'both' },
      { id: 'video_feeds', label: 'Video feeds', devices: 'both' },
      { id: 'right_hand_column', label: 'Right column', devices: 'desktop' },
      { id: 'story', label: 'Stories', devices: 'mobile' },
      { id: 'facebook_reels', label: 'Reels', devices: 'mobile' },
      { id: 'instream_video', label: 'In-stream video', devices: 'both' },
      { id: 'search', label: 'Search results', devices: 'both' },
      { id: 'facebook_reels_overlay', label: 'Reels overlay', devices: 'mobile' },
    ],
  },
  {
    id: 'instagram',
    label: 'Instagram',
    positions: [
      { id: 'stream', label: 'Feed', devices: 'both' },
      { id: 'profile_feed', label: 'Profile feed', devices: 'mobile' },
      { id: 'story', label: 'Stories', devices: 'mobile' },
      { id: 'explore', label: 'Explore', devices: 'mobile' },
      { id: 'explore_home', label: 'Explore home', devices: 'mobile' },
      { id: 'reels', label: 'Reels', devices: 'mobile' },
      { id: 'profile_reels', label: 'Profile reels', devices: 'mobile' },
      { id: 'ig_search', label: 'Search results', devices: 'mobile' },
    ],
  },
  {
    id: 'audience_network',
    label: 'Audience Network',
    positions: [
      { id: 'classic', label: 'Native, banner & interstitial', devices: 'mobile' },
      { id: 'rewarded_video', label: 'Rewarded video', devices: 'mobile' },
    ],
  },
  {
    id: 'messenger',
    label: 'Messenger',
    positions: [
      { id: 'messenger_home', label: 'Inbox', devices: 'mobile' },
      { id: 'story', label: 'Stories', devices: 'mobile' },
      { id: 'sponsored_messages', label: 'Sponsored messages', devices: 'mobile' },
    ],
  },
]

export function positionMatchesDevice(
  position: PlacementPosition,
  deviceMode: 'ALL' | 'MOBILE' | 'DESKTOP',
): boolean {
  if (deviceMode === 'ALL') return true
  if (position.devices === 'both') return true
  if (deviceMode === 'MOBILE') return position.devices === 'mobile'
  return position.devices === 'desktop'
}

export function allPositionsForPlatform(platformId: PlacementPlatform['id']): readonly string[] {
  const platform = PLACEMENT_CATALOG.find((p) => p.id === platformId)
  return platform ? platform.positions.map((pos) => pos.id) : []
}

export const ALL_PUBLISHER_PLATFORMS: readonly string[] = PLACEMENT_CATALOG.map((p) => p.id)
