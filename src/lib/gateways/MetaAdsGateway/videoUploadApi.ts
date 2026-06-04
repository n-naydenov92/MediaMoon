import { buildUrl, callGraphApi, callGraphApiMultipart } from './http'

interface GraphStartResponse {
  readonly upload_session_id?: string
  readonly video_id?: string
  readonly start_offset?: string
  readonly end_offset?: string
  readonly error?: { message: string; type: string; code: number }
}

interface GraphTransferResponse {
  readonly start_offset?: string
  readonly end_offset?: string
  readonly error?: { message: string; type: string; code: number }
}

interface GraphFinishResponse {
  readonly success?: boolean
  readonly error?: { message: string; type: string; code: number }
}

export interface VideoUploadStart {
  readonly uploadSessionId: string
  readonly videoId: string
  readonly startOffset: number
  readonly endOffset: number
}

export interface VideoUploadTransfer {
  readonly startOffset: number
  readonly endOffset: number
  readonly complete: boolean
}

export async function startVideoUpload(
  token: string,
  accountId: string,
  fileSize: number,
): Promise<VideoUploadStart> {
  const form = new FormData()
  form.append('upload_phase', 'start')
  form.append('file_size', String(fileSize))
  form.append('access_token', token)
  const json = await callGraphApiMultipart<GraphStartResponse>(
    `/${accountId}/advideos`,
    form,
  )
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  if (!json.upload_session_id || !json.video_id || json.start_offset === undefined || json.end_offset === undefined) {
    throw new Error('Meta API returned incomplete start response')
  }
  return {
    uploadSessionId: json.upload_session_id,
    videoId: json.video_id,
    startOffset: Number(json.start_offset),
    endOffset: Number(json.end_offset),
  }
}

export async function transferVideoChunk(
  token: string,
  accountId: string,
  uploadSessionId: string,
  startOffset: number,
  chunk: Blob,
): Promise<VideoUploadTransfer> {
  const form = new FormData()
  form.append('upload_phase', 'transfer')
  form.append('upload_session_id', uploadSessionId)
  form.append('start_offset', String(startOffset))
  form.append('video_file_chunk', chunk, 'chunk')
  form.append('access_token', token)
  const json = await callGraphApiMultipart<GraphTransferResponse>(
    `/${accountId}/advideos`,
    form,
  )
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  if (json.start_offset === undefined || json.end_offset === undefined) {
    throw new Error('Meta API returned incomplete transfer response')
  }
  const nextStart = Number(json.start_offset)
  const nextEnd = Number(json.end_offset)
  return {
    startOffset: nextStart,
    endOffset: nextEnd,
    complete: nextStart === nextEnd,
  }
}

interface GraphVideoSourceResponse {
  readonly source?: string
  readonly error?: { message: string; type: string; code: number }
}

// The downloadable CDN URL for an existing ad video, used to re-upload it into a
// different ad account (video ids are not portable across accounts).
export async function fetchVideoSource(token: string, videoId: string): Promise<string | null> {
  const url = buildUrl(`/${videoId}`, token, { fields: 'source' })
  const json = await callGraphApi<GraphVideoSourceResponse>(url)
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  return json.source ?? null
}

export async function finishVideoUpload(
  token: string,
  accountId: string,
  uploadSessionId: string,
): Promise<void> {
  const form = new FormData()
  form.append('upload_phase', 'finish')
  form.append('upload_session_id', uploadSessionId)
  form.append('access_token', token)
  const json = await callGraphApiMultipart<GraphFinishResponse>(
    `/${accountId}/advideos`,
    form,
  )
  if (json.error) {
    throw new Error(`Meta API error ${json.error.code}: ${json.error.message}`)
  }
  if (json.success !== true) {
    throw new Error('Meta API did not confirm video upload finish')
  }
}
