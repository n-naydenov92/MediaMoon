import type { JobStatus, LaunchJob } from '../../useLaunchQueue'

export type QueueFilter = 'all' | 'active' | 'done' | 'failed'

export const QUEUE_FILTERS: readonly { readonly id: QueueFilter; readonly label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'done', label: 'Done' },
  { id: 'failed', label: 'Failed' },
]

const ACTIVE_STATUSES: readonly JobStatus[] = ['queued', 'uploading', 'publishing']

export function filterJobs(jobs: readonly LaunchJob[], filter: QueueFilter): readonly LaunchJob[] {
  if (filter === 'all') {
    return jobs
  }
  if (filter === 'active') {
    return jobs.filter((j) => ACTIVE_STATUSES.includes(j.status))
  }
  if (filter === 'done') {
    return jobs.filter((j) => j.status === 'done')
  }
  return jobs.filter((j) => j.status === 'failed')
}

export function countActive(jobs: readonly LaunchJob[]): number {
  return jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length
}
