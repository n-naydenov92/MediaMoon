import type { JobStatus } from '../useLaunchQueue'

export const STATUS_ICONS: Record<JobStatus, string> = {
  queued: '·',
  uploading: '↑',
  publishing: '⟳',
  done: '✓',
  failed: '✕',
}

export const STATUS_LABELS: Record<JobStatus, string> = {
  queued: 'QUEUED',
  uploading: 'UPLOADING',
  publishing: 'PUBLISHING',
  done: 'DONE',
  failed: 'FAILED',
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
