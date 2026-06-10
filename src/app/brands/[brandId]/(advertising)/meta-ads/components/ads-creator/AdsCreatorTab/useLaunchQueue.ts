'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { extractVideoThumbnail } from '../launchPipeline/imageProcessing'
import {
  publishAd,
  reuploadCreativeFromSource,
  uploadImageSingleShot,
  uploadVideoChunked,
  type MediaRef,
  type PublishPayload,
} from '../launchPipeline/mediaUpload'
import type { AssetCreative } from './assetCreative'

export type JobStatus = 'queued' | 'uploading' | 'publishing' | 'done' | 'failed'

interface BaseJob {
  readonly id: string
  readonly status: JobStatus
  readonly error: string | null
}

// A creative/ad job: uploaded media that runs through the upload → publish
// pipeline.
export interface AdJob extends BaseJob {
  readonly kind: 'ad'
  // Groups the ads enqueued by one Publish click, so progress reflects the
  // current batch only — not ads published in earlier batches.
  readonly batchId: string
  readonly name: string
  // The ad set this ad was published into — snapshotted at enqueue time, since the
  // queue history outlives the draft's loaded ad-set list.
  readonly destination: string
  readonly fileName: string
  readonly fileSize: number
  readonly mediaType: 'video' | 'image'
  readonly progress: number
  readonly adId: string | null
}

// An ad set creation record. The dialog performs the create call itself, so
// this is logged straight as a finished entry for queue visibility.
export interface AdSetJob extends BaseJob {
  readonly kind: 'adSet'
  readonly name: string
  // The campaign this ad set was created under.
  readonly destination: string
  readonly adSetId: string
  readonly accountId: string
}

export type LaunchJob = AdJob | AdSetJob

export interface AdSetRecord {
  readonly name: string
  readonly campaignName: string
  readonly adSetId: string
  readonly accountId: string
}

export interface UseLaunchQueueResult {
  readonly jobs: readonly LaunchJob[]
  readonly enqueue: (payload: PublishPayload, file: File, batchId: string, destination: string) => void
  readonly enqueueAsset: (
    payload: PublishPayload,
    asset: AssetCreative,
    batchId: string,
    destination: string,
  ) => void
  readonly retry: (jobId: string) => void
  readonly stop: (jobId: string) => void
  readonly dismiss: (jobId: string) => void
  readonly recordAdSet: (record: AdSetRecord) => void
}

type JobSource =
  | { readonly kind: 'file'; readonly file: File }
  | { readonly kind: 'asset'; readonly asset: AssetCreative }

interface PendingJob {
  readonly job: AdJob
  readonly source: JobSource
  readonly payload: PublishPayload
}

const MAX_CONCURRENT = 3
const ACTIVE_STATUSES = new Set<JobStatus>(['uploading', 'publishing'])

export function useLaunchQueue(): UseLaunchQueueResult {
  const [jobs, setJobs] = useState<readonly LaunchJob[]>([])
  const pendingRef = useRef<Map<string, PendingJob>>(new Map())
  const startedRef = useRef<Set<string>>(new Set())
  const controllersRef = useRef<Map<string, AbortController>>(new Map())

  const updateJob = useCallback((id: string, patch: Partial<AdJob>): void => {
    setJobs((prev) => prev.map((j) => (j.id === id && j.kind === 'ad' ? { ...j, ...patch } : j)))
  }, [])

  const runJob = useCallback(async (pending: PendingJob): Promise<void> => {
    const { job, source, payload } = pending
    const controller = new AbortController()
    controllersRef.current.set(job.id, controller)
    const { signal } = controller
    try {
      updateJob(job.id, { status: 'uploading', progress: 0 })
      let mediaRef: MediaRef
      if (source.kind === 'asset') {
        updateJob(job.id, { progress: 50 })
        mediaRef = await reuploadCreativeFromSource(source.asset, payload.accountId, signal)
      } else if (job.mediaType === 'video') {
        const { file } = source
        const thumbnailFile = await extractVideoThumbnail(file, signal)
        const [videoId, thumbnailHash] = await Promise.all([
          uploadVideoChunked(file, payload.accountId, (pct: number) => {
            updateJob(job.id, { progress: pct * 0.95 })
          }, signal),
          uploadImageSingleShot(thumbnailFile, payload.accountId, () => {}, signal),
        ])
        mediaRef = { videoId, thumbnailHash }
      } else {
        mediaRef = {
          imageHash: await uploadImageSingleShot(source.file, payload.accountId, (pct: number) => {
            updateJob(job.id, { progress: pct })
          }, signal),
        }
      }
      updateJob(job.id, { status: 'publishing', progress: 100 })
      const { adId } = await publishAd(payload, mediaRef, signal)
      updateJob(job.id, { status: 'done', adId })
      // Only drop the retained source on success — a failed job keeps it so Retry can
      // re-run from the original file/payload (dismiss clears it otherwise).
      pendingRef.current.delete(job.id)
    } catch (err) {
      const failure = err instanceof Error ? err.message : 'Unknown error'
      const message = signal.aborted ? 'Stopped manually.' : failure
      updateJob(job.id, { status: 'failed', error: message })
    } finally {
      controllersRef.current.delete(job.id)
    }
  }, [updateJob])

  useEffect(() => {
    const activeCount = jobs.filter((j) => ACTIVE_STATUSES.has(j.status)).length
    if (activeCount >= MAX_CONCURRENT) {
      return
    }
    const queued = jobs.filter(
      (j): j is AdJob => j.kind === 'ad' && j.status === 'queued' && !startedRef.current.has(j.id),
    )
    const slotsAvailable = MAX_CONCURRENT - activeCount
    for (const job of queued.slice(0, slotsAvailable)) {
      const pending = pendingRef.current.get(job.id)
      if (!pending) continue
      startedRef.current.add(job.id)
      void runJob(pending)
    }
  }, [jobs, runJob])

  const enqueue = useCallback(
    (payload: PublishPayload, file: File, batchId: string, destination: string): void => {
      const id = crypto.randomUUID()
      const mediaType: 'video' | 'image' = file.type.startsWith('video/') ? 'video' : 'image'
      const job: AdJob = {
        id,
        kind: 'ad',
        batchId,
        name: payload.copy.name.trim() || file.name,
        destination,
        fileName: file.name,
        fileSize: file.size,
        mediaType,
        status: 'queued',
        progress: 0,
        error: null,
        adId: null,
      }
      pendingRef.current.set(id, { job, source: { kind: 'file', file }, payload })
      setJobs((prev) => [...prev, job])
    },
    [],
  )

  const enqueueAsset = useCallback(
    (payload: PublishPayload, asset: AssetCreative, batchId: string, destination: string): void => {
      const id = crypto.randomUUID()
      const job: AdJob = {
        id,
        kind: 'ad',
        batchId,
        name: payload.copy.name.trim() || asset.name,
        destination,
        fileName: asset.name,
        fileSize: 0,
        mediaType: asset.mediaType,
        status: 'queued',
        progress: 0,
        error: null,
        adId: null,
      }
      pendingRef.current.set(id, { job, source: { kind: 'asset', asset }, payload })
      setJobs((prev) => [...prev, job])
    },
    [],
  )

  const recordAdSet = useCallback(({ name, campaignName, adSetId, accountId }: AdSetRecord): void => {
    const job: AdSetJob = {
      id: crypto.randomUUID(),
      kind: 'adSet',
      status: 'done',
      error: null,
      name,
      destination: campaignName,
      adSetId,
      accountId,
    }
    setJobs((prev) => [...prev, job])
  }, [])

  const retry = useCallback((jobId: string): void => {
    const job = jobs.find((j) => j.id === jobId)
    if (!job || job.status !== 'failed') return
    startedRef.current.delete(jobId)
    const existing = pendingRef.current.get(jobId)
    if (!existing) {
      updateJob(jobId, { status: 'failed', error: 'Cannot retry: source file was lost (page was refreshed).' })
      return
    }
    updateJob(jobId, { status: 'queued', progress: 0, error: null })
  }, [jobs, updateJob])

  // Manually fail a stuck in-flight job: aborts its requests, frees the
  // concurrency slot for queued jobs, and lands it in Failed (where it can be
  // retried or dismissed). The runJob catch reports it as "Stopped manually".
  const stop = useCallback((jobId: string): void => {
    const controller = controllersRef.current.get(jobId)
    if (controller) {
      controller.abort()
    }
  }, [])

  const dismiss = useCallback((jobId: string): void => {
    controllersRef.current.get(jobId)?.abort()
    controllersRef.current.delete(jobId)
    pendingRef.current.delete(jobId)
    startedRef.current.delete(jobId)
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
  }, [])

  return { jobs, enqueue, enqueueAsset, retry, stop, dismiss, recordAdSet }
}
