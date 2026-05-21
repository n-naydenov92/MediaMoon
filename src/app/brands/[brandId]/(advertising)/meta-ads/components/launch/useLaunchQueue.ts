'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  extractVideoThumbnail,
  publishAd,
  uploadImageSingleShot,
  uploadVideoChunked,
  type PublishPayload,
} from './launchQueueHelpers'

export type JobStatus = 'queued' | 'uploading' | 'publishing' | 'done' | 'failed'

export interface LaunchJob {
  readonly id: string
  readonly fileName: string
  readonly fileSize: number
  readonly mediaType: 'video' | 'image'
  readonly status: JobStatus
  readonly progress: number
  readonly error: string | null
  readonly adId: string | null
}

export interface UseLaunchQueueResult {
  readonly jobs: readonly LaunchJob[]
  readonly enqueue: (payload: PublishPayload, file: File) => void
  readonly retry: (jobId: string) => void
  readonly dismiss: (jobId: string) => void
}

interface PendingJob {
  readonly job: LaunchJob
  readonly file: File
  readonly payload: PublishPayload
}

const MAX_CONCURRENT = 3
const ACTIVE_STATUSES = new Set<JobStatus>(['uploading', 'publishing'])

export function useLaunchQueue(): UseLaunchQueueResult {
  const [jobs, setJobs] = useState<readonly LaunchJob[]>([])
  const pendingRef = useRef<Map<string, PendingJob>>(new Map())
  const startedRef = useRef<Set<string>>(new Set())

  const updateJob = useCallback((id: string, patch: Partial<LaunchJob>): void => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)))
  }, [])

  const runJob = useCallback(async (pending: PendingJob): Promise<void> => {
    const { job, file, payload } = pending
    try {
      updateJob(job.id, { status: 'uploading', progress: 0 })
      let mediaRef: { imageHash?: string; videoId?: string; thumbnailHash?: string }
      if (job.mediaType === 'video') {
        const thumbnailFile = await extractVideoThumbnail(file)
        const [videoId, thumbnailHash] = await Promise.all([
          uploadVideoChunked(file, payload.accountId, (pct) => {
            updateJob(job.id, { progress: pct * 0.95 })
          }),
          uploadImageSingleShot(thumbnailFile, payload.accountId, () => {}),
        ])
        mediaRef = { videoId, thumbnailHash }
      } else {
        mediaRef = {
          imageHash: await uploadImageSingleShot(file, payload.accountId, (pct) => {
            updateJob(job.id, { progress: pct })
          }),
        }
      }
      updateJob(job.id, { status: 'publishing', progress: 100 })
      const { adId } = await publishAd(payload, mediaRef)
      updateJob(job.id, { status: 'done', adId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      updateJob(job.id, { status: 'failed', error: message })
    } finally {
      pendingRef.current.delete(job.id)
    }
  }, [updateJob])

  useEffect(() => {
    const activeCount = jobs.filter((j) => ACTIVE_STATUSES.has(j.status)).length
    if (activeCount >= MAX_CONCURRENT) {
      return
    }
    const queued = jobs.filter((j) => j.status === 'queued' && !startedRef.current.has(j.id))
    const slotsAvailable = MAX_CONCURRENT - activeCount
    for (const job of queued.slice(0, slotsAvailable)) {
      const pending = pendingRef.current.get(job.id)
      if (!pending) continue
      startedRef.current.add(job.id)
      void runJob(pending)
    }
  }, [jobs, runJob])

  const enqueue = useCallback((payload: PublishPayload, file: File): void => {
    const id = crypto.randomUUID()
    const mediaType: 'video' | 'image' = file.type.startsWith('video/') ? 'video' : 'image'
    const job: LaunchJob = {
      id,
      fileName: file.name,
      fileSize: file.size,
      mediaType,
      status: 'queued',
      progress: 0,
      error: null,
      adId: null,
    }
    pendingRef.current.set(id, { job, file, payload })
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

  const dismiss = useCallback((jobId: string): void => {
    pendingRef.current.delete(jobId)
    startedRef.current.delete(jobId)
    setJobs((prev) => prev.filter((j) => j.id !== jobId))
  }, [])

  return { jobs, enqueue, retry, dismiss }
}
