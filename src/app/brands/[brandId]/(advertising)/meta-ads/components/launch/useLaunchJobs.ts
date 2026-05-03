'use client'

import { useCallback, useEffect, useState } from 'react'
import { upload } from '@vercel/blob/client'
import type { CtaType, FileStatus, Job, JobFile, JobStatus } from '@prisma/client'
import type { BrandId } from '@/config/brands'
import type { Market } from '@/types'
import { sanitizeFilename, BLOB_PATH_PREFIX } from '@/lib/meta/blobStorage'

interface UploadProgressEvent {
  readonly loaded: number
  readonly total: number
  readonly percentage: number
}

const POLL_INTERVAL_MS = 2000
const ACTIVE_JOB_STATUSES: ReadonlySet<JobStatus> = new Set(['QUEUED', 'RUNNING'] as JobStatus[])

export interface JobWithFiles extends Job {
  readonly files: readonly JobFile[]
}

export interface CreateJobPayload {
  readonly brandId: BrandId
  readonly market: Market
  readonly accountId: string
  readonly campaignId: string
  readonly adSetId: string
  readonly pageId: string
  readonly copy: {
    readonly headline: string
    readonly body: string
    readonly url: string
    readonly cta: CtaType
  }
  readonly files: readonly File[]
}

export type CreateJobResult = { readonly ok: true } | { readonly ok: false; readonly message: string }

export type LaunchState =
  | { readonly status: 'idle' }
  | { readonly status: 'creating' }
  | { readonly status: 'error'; readonly message: string }

export interface UseLaunchJobsResult {
  readonly state: LaunchState
  readonly jobs: readonly JobWithFiles[]
  readonly clientProgress: Readonly<Record<string, number>>
  readonly createAndStartJob: (payload: CreateJobPayload) => Promise<CreateJobResult>
  readonly cancelJob: (jobId: string) => Promise<void>
  readonly refresh: () => Promise<void>
}

interface CreateJobResponse {
  jobId: string
  batchNumber: number
  files: readonly { id: string; originalName: string; mimeType: string }[]
}

export function useLaunchJobs(brandId: BrandId): UseLaunchJobsResult {
  const [state, setState] = useState<LaunchState>({ status: 'idle' })
  const [jobs, setJobs] = useState<readonly JobWithFiles[]>([])
  const [clientProgress, setClientProgress] = useState<Record<string, number>>({})

  const refresh = useCallback(async (): Promise<void> => {
    const response = await fetch(`/api/meta-ads/jobs?brandId=${brandId}`, { cache: 'no-store' })
    if (!response.ok) {
      return
    }
    const { jobs: payload } = (await response.json()) as { jobs: readonly JobWithFiles[] }
    setJobs(payload)
  }, [brandId])

  useEffect(() => {
    void refresh()
    const hasActive = jobs.some((j) => ACTIVE_JOB_STATUSES.has(j.status))
    if (!hasActive) {
      return
    }
    const handle = setInterval(() => {
      void refresh()
    }, POLL_INTERVAL_MS)
    return () => clearInterval(handle)
  }, [jobs, refresh])

  const createAndStartJob = useCallback(
    async (payload: CreateJobPayload): Promise<CreateJobResult> => {
      setState({ status: 'creating' })
      try {
        const created = await callCreateJob(payload)
        await uploadAllFiles(created.jobId, created.files, payload.files, (fileId, percent) => {
          setClientProgress((prev) => ({ ...prev, [fileId]: percent }))
        })
        await callStartJob(created.jobId)
        setState({ status: 'idle' })
        setClientProgress({})
        void refresh()
        return { ok: true }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setState({ status: 'error', message })
        return { ok: false, message }
      }
    },
    [refresh],
  )

  const cancelJob = useCallback(
    async (jobId: string): Promise<void> => {
      await fetch(`/api/meta-ads/jobs/${jobId}/cancel`, { method: 'POST' })
      void refresh()
    },
    [refresh],
  )

  return { state, jobs, clientProgress, createAndStartJob, cancelJob, refresh }
}

async function callCreateJob(payload: CreateJobPayload): Promise<CreateJobResponse> {
  const response = await fetch('/api/meta-ads/jobs/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      brandId: payload.brandId,
      market: payload.market,
      accountId: payload.accountId,
      campaignId: payload.campaignId,
      adSetId: payload.adSetId,
      pageId: payload.pageId,
      copy: payload.copy,
      files: payload.files.map((f) => ({
        originalName: f.name,
        mimeType: f.type || 'application/octet-stream',
        sizeBytes: f.size,
      })),
    }),
  })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `HTTP ${response.status}`)
  }
  return (await response.json()) as CreateJobResponse
}

async function uploadAllFiles(
  jobId: string,
  serverFiles: readonly { id: string; originalName: string; mimeType: string }[],
  browserFiles: readonly File[],
  onProgress: (fileId: string, percent: number) => void,
): Promise<void> {
  const pairs = serverFiles.map((meta, index) => {
    const browserFile = browserFiles[index]
    if (!browserFile) {
      throw new Error(`Browser file at index ${index} is missing`)
    }
    return { meta, browserFile }
  })

  await Promise.all(
    pairs.map(async ({ meta, browserFile }) => {
      const pathname = `${BLOB_PATH_PREFIX}/${jobId}/${meta.id}-${sanitizeFilename(meta.originalName)}`
      await upload(pathname, browserFile, {
        access: 'public',
        handleUploadUrl: '/api/meta-ads/jobs/upload',
        clientPayload: JSON.stringify({ jobId, fileId: meta.id }),
        onUploadProgress: (event: UploadProgressEvent) => {
          onProgress(meta.id, event.percentage)
        },
      })
    }),
  )
}

async function callStartJob(jobId: string): Promise<void> {
  const response = await fetch(`/api/meta-ads/jobs/${jobId}/start`, { method: 'POST' })
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? `HTTP ${response.status}`)
  }
}

export type { JobStatus, FileStatus, JobFile }
