import type { JobStatus } from '../useLaunchQueue'

export const STATUS_LABELS: Record<JobStatus, string> = {
  queued: 'QUEUED',
  uploading: 'UPLOADING',
  publishing: 'PUBLISHING',
  done: 'DONE',
  failed: 'FAILED',
}

export const PROCESSING_LABEL = 'PROCESSING'
export const PROCESSING_HINT = "The browser couldn't take a thumbnail frame, so this ad waits for Meta to "
  + 'finish processing the video and uses the frame Meta generates.'
