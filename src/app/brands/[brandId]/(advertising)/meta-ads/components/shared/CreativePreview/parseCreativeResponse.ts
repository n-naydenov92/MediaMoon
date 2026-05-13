import type { CreativePreviewData } from './creativePreviewTypes'

interface ApiResponse {
  readonly ad?: Record<string, unknown>
  readonly post_preview?: Record<string, unknown> | null
  readonly video_url?: string | null
  readonly video_thumbnail?: string | null
}

interface PostAttachment {
  readonly title?: string
  readonly description?: string
  readonly url?: string
  readonly media?: { readonly image?: { readonly src?: string } }
  readonly subattachments?: { readonly data?: PostAttachment[] }
}

export interface ParsedCreative {
  readonly data: CreativePreviewData
  readonly hasContent: boolean
}

export function parseCreativeResponse(adId: string, raw: ApiResponse): ParsedCreative {
  const ad = raw.ad ?? {}
  const creative = (ad['creative'] as Record<string, unknown> | undefined) ?? {}
  const storySpec = creative['object_story_spec'] as Record<string, unknown> | undefined
  const linkData = storySpec?.['link_data'] as Record<string, unknown> | undefined
  const videoData = storySpec?.['video_data'] as Record<string, unknown> | undefined
  const photoData = storySpec?.['photo_data'] as Record<string, unknown> | undefined
  const childAttachments = linkData?.['child_attachments'] as
    | Array<Record<string, unknown>>
    | undefined
  const firstChild = childAttachments?.[0]
  const assetFeed = creative['asset_feed_spec'] as Record<string, unknown> | undefined
  const assetBodies = assetFeed?.['bodies'] as Array<{ text?: string }> | undefined
  const assetTitles = assetFeed?.['titles'] as Array<{ text?: string }> | undefined
  const assetDescriptions = assetFeed?.['descriptions'] as Array<{ text?: string }> | undefined
  const callToActionObj =
    (linkData?.['call_to_action'] as Record<string, unknown> | undefined) ??
    (videoData?.['call_to_action'] as Record<string, unknown> | undefined) ??
    (creative['call_to_action'] as Record<string, unknown> | undefined)
  const ctaTypeFromObj = callToActionObj?.['type'] as string | undefined
  const ctaTypeFromAsset = pickFirstAssetCtaType(creative['asset_feed_spec'])
  const ctaType = ctaTypeFromObj ?? ctaTypeFromAsset

  const previewRaw = raw.post_preview ?? {}
  const previewHasError = !!(previewRaw as { error?: unknown }).error
  const preview = previewHasError ? {} : previewRaw

  const attachment = extractFirstAttachment(preview)
  const previewFrom = preview['from'] as { name?: string; id?: string } | undefined
  const previewStory = preview['story'] as Record<string, unknown> | undefined
  const storyFrom = previewStory?.['from'] as { name?: string; id?: string } | undefined

  const storyId = pickString(creative['effective_object_story_id'])
  const pageIdFromStoryId = storyId?.includes('_') ? storyId.split('_')[0] : undefined

  const pageId =
    (storySpec?.['page_id'] as string | undefined) ??
    previewFrom?.id ??
    storyFrom?.id ??
    pageIdFromStoryId ??
    null

  const body =
    pickString(linkData?.['message']) ??
    pickString(videoData?.['message']) ??
    pickString(photoData?.['message']) ??
    pickString(creative['body']) ??
    pickString(preview['message']) ??
    pickString(assetBodies?.[0]?.text)

  const headline =
    pickString(linkData?.['name']) ??
    pickString(videoData?.['title']) ??
    pickString(creative['title']) ??
    pickString(attachment?.title) ??
    pickString(firstChild?.['name']) ??
    pickString(assetTitles?.[0]?.text)

  const description =
    pickString(linkData?.['description']) ??
    pickString(videoData?.['link_description']) ??
    pickString(attachment?.description) ??
    pickString(firstChild?.['description']) ??
    pickString(assetDescriptions?.[0]?.text)

  const imageUrl =
    pickString(preview['full_picture']) ??
    pickString(attachment?.media?.image?.src) ??
    pickString(creative['image_url']) ??
    pickString(creative['thumbnail_url'])

  const data: CreativePreviewData = {
    adId,
    adName: pickString(ad['name']) ?? '',
    pageName: previewFrom?.name ?? storyFrom?.name ?? null,
    pageAvatarUrl: pageId ? `https://graph.facebook.com/${pageId}/picture?type=square` : null,
    body: body ?? null,
    headline: headline ?? null,
    description: description ?? null,
    callToAction: ctaType ? prettifyCta(ctaType) : null,
    imageUrl: imageUrl ?? null,
    videoUrl: raw.video_url ?? null,
    videoThumbnail: raw.video_thumbnail ?? null,
  }

  const hasContent = !!(data.body || data.headline || data.imageUrl || data.videoUrl)
  return { data, hasContent }
}

function pickString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function extractFirstAttachment(preview: Record<string, unknown>): PostAttachment | null {
  const attachments = preview['attachments'] as { data?: PostAttachment[] } | undefined
  const first = attachments?.data?.[0]
  if (!first) return null
  const subFirst = first.subattachments?.data?.[0]
  return subFirst ?? first
}

function prettifyCta(type: string): string {
  return type
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

function pickFirstAssetCtaType(spec: unknown): string | undefined {
  const asset = spec as { call_to_action_types?: string[] } | undefined
  return asset?.call_to_action_types?.[0]
}
