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

  if (params.imageHash) {
    return {
      page_id: params.pageId,
      link_data: {
        image_hash: params.imageHash,
        link: params.destinationUrl,
        message: params.bodyText,
        name: params.headline,
        call_to_action: callToAction,
      },
    }
  }

  if (params.videoId) {
    return {
      page_id: params.pageId,
      video_data: {
        video_id: params.videoId,
        title: params.headline,
        message: params.bodyText,
        call_to_action: callToAction,
      },
    }
  }

  return {
    page_id: params.pageId,
    link_data: {
      link: params.destinationUrl,
      message: params.bodyText,
      name: params.headline,
      call_to_action: callToAction,
    },
  }
}
