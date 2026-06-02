import type { JobStatus } from '../useLaunchQueue'

export const STATUS_LABELS: Record<JobStatus, string> = {
  queued: 'QUEUED',
  uploading: 'UPLOADING',
  publishing: 'PUBLISHING',
  done: 'DONE',
  failed: 'FAILED',
}
