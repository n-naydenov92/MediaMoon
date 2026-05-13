import { FileStatus } from '@prisma/client'
import type { JobFile } from '../../useLaunchJobs'

const STATUS_WEIGHTS: Record<FileStatus, number> = {
  [FileStatus.QUEUED]: 0,
  [FileStatus.UPLOADING]: 0,
  [FileStatus.UPLOADED]: 50,
  [FileStatus.PUBLISHING]: 75,
  [FileStatus.DONE]: 100,
  [FileStatus.FAILED]: 100,
}

const UPLOAD_PROGRESS_WEIGHT = 0.5

export function adsManagerUrl(accountId: string): string {
  return `https://business.facebook.com/adsmanager/manage/ads?act=${accountId.replace('act_', '')}`
}

export function progressLabel(
  file: JobFile,
  clientProgress: Readonly<Record<string, number>>,
): string | null {
  if (file.status !== FileStatus.UPLOADING) {
    return null
  }
  const pct = clientProgress[file.id]
  return typeof pct === 'number' ? `${pct.toFixed(0)}%` : null
}

export function countByStatus(files: readonly JobFile[]): { done: number; failed: number; inFlight: number } {
  let done = 0
  let failed = 0
  let inFlight = 0
  for (const f of files) {
    if (f.status === FileStatus.DONE) done += 1
    else if (f.status === FileStatus.FAILED) failed += 1
    else inFlight += 1
  }
  return { done, failed, inFlight }
}

export function computeOverallPercent(
  files: readonly JobFile[],
  clientProgress: Readonly<Record<string, number>>,
): number {
  if (files.length === 0) {
    return 0
  }
  const sum = files.reduce((acc, f) => {
    const base = STATUS_WEIGHTS[f.status]
    if (f.status === FileStatus.QUEUED || f.status === FileStatus.UPLOADING) {
      return acc + (clientProgress[f.id] ?? 0) * UPLOAD_PROGRESS_WEIGHT
    }
    return acc + base
  }, 0)
  return Math.min(100, Math.round(sum / files.length))
}
