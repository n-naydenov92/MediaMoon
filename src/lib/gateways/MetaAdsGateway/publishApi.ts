import { callGraphApiMultipart, callGraphApiPost } from './http'
import type { AdCreativeParams } from './types'

interface GraphImageUploadResponse {
  images: Record<string, { hash: string; url: string }>
  error?: { message: string; type: string; code: number }
}

interface GraphVideoUploadResponse {
  id: string
  error?: { message: string; type: string; code: number }
}

interface GraphCreativeResponse {
  id: string
  error?: { message: string; type: string; code: number }
}

interface GraphAdResponse {
  id: string
  error?: { message: string; type: string; code: number }
}

export async function uploadImage(
  token: string,
  accountId: string,
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
): Promise<{ hash: string }> {
  const form = new FormData()
  const blob = new Blob([bytes], { type: mimeType })
  form.append(filename, blob, filename)
  form.append('access_token', token)
  const json = await callGraphApiMultipart<GraphImageUploadResponse>(
    `/${accountId}/adimages`,
    form,
  )
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  const entry = json.images[filename]
  if (!entry) {
    throw new Error('Meta API returned no image hash')
  }
  return { hash: entry.hash }
}

export async function uploadVideo(
  token: string,
  accountId: string,
  bytes: ArrayBuffer,
  filename: string,
  mimeType: string,
): Promise<{ id: string }> {
  const form = new FormData()
  const blob = new Blob([bytes], { type: mimeType })
  form.append('source', blob, filename)
  form.append('title', filename)
  form.append('access_token', token)
  const json = await callGraphApiMultipart<GraphVideoUploadResponse>(
    `/${accountId}/advideos`,
    form,
  )
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return { id: json.id }
}

export async function createAdCreative(
  token: string,
  params: AdCreativeParams,
): Promise<{ id: string }> {
  const storySpec = buildStorySpec(params)
  const body = new URLSearchParams({
    name: `Creative – ${params.headline}`,
    object_story_spec: JSON.stringify(storySpec),
    access_token: token,
  })
  const json = await callGraphApiPost<GraphCreativeResponse>(
    `/${params.accountId}/adcreatives`,
    body,
  )
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return { id: json.id }
}

export async function createAd(
  token: string,
  accountId: string,
  adSetId: string,
  creativeId: string,
  name: string,
): Promise<{ id: string }> {
  const body = new URLSearchParams({
    name,
    adset_id: adSetId,
    creative: JSON.stringify({ creative_id: creativeId }),
    status: 'PAUSED',
    access_token: token,
  })
  const json = await callGraphApiPost<GraphAdResponse>(`/${accountId}/ads`, body)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return { id: json.id }
}

function buildStorySpec(params: AdCreativeParams): Record<string, unknown> {
  const callToAction = {
    type: params.ctaType,
    value: { link: params.destinationUrl },
  }

  const base: Record<string, unknown> = { page_id: params.pageId }
  if (params.instagramActorId) {
    // Modern field accepting the Instagram Business Account ID returned by
    // `/{pageId}?fields=instagram_business_account`. The legacy `instagram_actor_id`
    // field rejects this ID format with "must be a valid Instagram account id".
    base.instagram_user_id = params.instagramActorId
  }

  if (params.imageHash) {
    const linkData: Record<string, unknown> = {
      image_hash: params.imageHash,
      link: params.destinationUrl,
      call_to_action: callToAction,
    }
    if (params.bodyText) linkData.message = params.bodyText
    if (params.headline) linkData.name = params.headline
    if (params.description) linkData.description = params.description
    return { ...base, link_data: linkData }
  }

  if (params.videoId) {
    const videoData: Record<string, unknown> = {
      video_id: params.videoId,
      call_to_action: callToAction,
    }
    if (params.thumbnailHash) videoData.image_hash = params.thumbnailHash
    if (params.headline) videoData.title = params.headline
    if (params.bodyText) videoData.message = params.bodyText
    if (params.description) videoData.link_description = params.description
    return { ...base, video_data: videoData }
  }

  const linkData: Record<string, unknown> = {
    link: params.destinationUrl,
    call_to_action: callToAction,
  }
  if (params.bodyText) linkData.message = params.bodyText
  if (params.headline) linkData.name = params.headline
  if (params.description) linkData.description = params.description
  return { ...base, link_data: linkData }
}
