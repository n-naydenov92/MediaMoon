import type { JobStatus, LaunchJob } from '../useLaunchQueue'

const ACTIVE_STATUSES: readonly JobStatus[] = ['queued', 'uploading', 'publishing']

export interface GroupedJobs {
  readonly active: readonly LaunchJob[]
  readonly failed: readonly LaunchJob[]
  readonly done: readonly LaunchJob[]
}

export function groupJobs(jobs: readonly LaunchJob[]): GroupedJobs {
  return {
    active: jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)),
    failed: jobs.filter((j) => j.status === 'failed'),
    done: jobs.filter((j) => j.status === 'done'),
  }
}

export function countActive(jobs: readonly LaunchJob[]): number {
  return jobs.filter((j) => ACTIVE_STATUSES.includes(j.status)).length
}
