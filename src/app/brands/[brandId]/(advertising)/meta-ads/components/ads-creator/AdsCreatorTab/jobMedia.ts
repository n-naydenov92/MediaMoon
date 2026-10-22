import { tryExtractVideoThumbnail } from '../launchPipeline/imageProcessing'
import {
  reuploadCreativeFromSource,
  uploadImageSingleShot,
  uploadVideoChunked,
  waitForMetaThumbnail,
  type MediaRef,
} from '../launchPipeline/mediaUpload'
import type { UploadListener, UploadTask } from '../launchPipeline/sharedUploads'
import type { AssetCreative } from './assetCreative'

// The last 5% is left for the thumbnail and finalize steps after the bytes are sent.
const VIDEO_TRANSFER_PROGRESS_SHARE = 0.95
const ASSET_COPY_PROGRESS = 50

export type JobSource =
  | { readonly kind: 'file'; readonly file: File }
  | { readonly kind: 'asset'; readonly asset: AssetCreative }

// Same media headed for the same ad account → same key → one shared upload. A picked
// file has no stable id, so name + size + last-modified stands in for one.
export function mediaKey(source: JobSource, accountId: string): string {
  if (source.kind === 'asset') {
    return `${accountId}:asset:${source.asset.assetKey}`
  }
  const { name, size, lastModified } = source.file
  return `${accountId}:file:${name}:${size}:${lastModified}`
}

export function mediaUploadTask(
  source: JobSource,
  mediaType: 'video' | 'image',
  accountId: string,
): UploadTask {
  return async (signal, report) => {
    if (source.kind === 'asset') {
      report.onProgress(ASSET_COPY_PROGRESS)
      return reuploadCreativeFromSource(source.asset, accountId, signal)
    }
    if (mediaType === 'video') {
      return uploadVideo(source.file, accountId, signal, report)
    }
    return { imageHash: await uploadImageSingleShot(source.file, accountId, report.onProgress, signal) }
  }
}

async function uploadVideo(
  file: File,
  accountId: string,
  signal: AbortSignal,
  report: UploadListener,
): Promise<MediaRef> {
  const thumbnailFile = await tryExtractVideoThumbnail(file, signal)
  const [videoId, browserThumbnailHash] = await Promise.all([
    uploadVideoChunked(file, accountId, (pct: number) => {
      report.onProgress(pct * VIDEO_TRANSFER_PROGRESS_SHARE)
    }, signal),
    thumbnailFile
      ? uploadImageSingleShot(thumbnailFile, accountId, () => {}, signal)
      : Promise.resolve(null),
  ])
  if (browserThumbnailHash) {
    return { videoId, thumbnailHash: browserThumbnailHash }
  }
  report.onWaitingForMeta()
  return { videoId, thumbnailHash: await waitForMetaThumbnail(videoId, accountId, signal) }
}
