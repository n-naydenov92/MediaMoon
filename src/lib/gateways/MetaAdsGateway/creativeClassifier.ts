type CreativeType = 'image' | 'video' | 'unknown'

interface CreativeRaw {
  readonly id?: string
  readonly thumbnail_url?: string
  readonly object_type?: string
  readonly video_id?: string
}

const OBJECT_TYPE_TO_CREATIVE: Record<string, CreativeType> = {
  VIDEO: 'video',
  IMAGE: 'image',
  PHOTO: 'image',
  SHARE: 'image',
}

export function classifyCreativeType(creative: CreativeRaw | undefined): CreativeType {
  if (!creative) {
    return 'unknown'
  }
  if (creative.video_id) {
    return 'video'
  }
  if (creative.object_type) {
    return OBJECT_TYPE_TO_CREATIVE[creative.object_type] ?? 'unknown'
  }
  return 'unknown'
}
