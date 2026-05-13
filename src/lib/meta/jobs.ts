import { CtaType, FileStatus, JobStatus, type Job, type JobFile } from '@prisma/client'
import { prisma } from '@/lib/db'

export type JobWithFiles = Job & { readonly files: readonly JobFile[] }

export interface CreateJobInput {
  readonly brandId: string
  readonly market: string
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
  readonly files: readonly {
    readonly originalName: string
    readonly mimeType: string
    readonly sizeBytes: number
  }[]
}

export async function createJobWithFiles(input: CreateJobInput): Promise<JobWithFiles> {
  const batchNumber = await nextBatchNumberForBrand(input.brandId)
  return prisma.job.create({
    data: {
      brandId: input.brandId,
      market: input.market,
      accountId: input.accountId,
      campaignId: input.campaignId,
      adSetId: input.adSetId,
      pageId: input.pageId,
      copyHeadline: input.copy.headline,
      copyBody: input.copy.body,
      copyUrl: input.copy.url,
      copyCta: input.copy.cta,
      batchNumber,
      files: { create: input.files.map((f) => ({ ...f })) },
    },
    include: { files: true },
  })
}

export async function getJobWithFiles(jobId: string): Promise<JobWithFiles | null> {
  return prisma.job.findUnique({
    where: { id: jobId },
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
}

export async function listRecentJobsForBrand(
  brandId: string,
  limit: number = 30,
): Promise<readonly JobWithFiles[]> {
  return prisma.job.findMany({
    where: { brandId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { files: { orderBy: { createdAt: 'asc' } } },
  })
}

export async function listCompletedUploadsForBrand(
  brandId: string,
  limit: number = 60,
): Promise<readonly JobFile[]> {
  return prisma.jobFile.findMany({
    where: {
      status: FileStatus.DONE,
      job: { brandId },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
}

export async function markFileUploaded(fileId: string, blobUrl: string): Promise<JobFile> {
  return prisma.jobFile.update({
    where: { id: fileId },
    data: { blobUrl, status: FileStatus.UPLOADED, progress: 1 },
  })
}

export async function markJobRunning(jobId: string): Promise<Job> {
  return prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.RUNNING },
  })
}

export async function markFilePublishing(fileId: string): Promise<JobFile> {
  return prisma.jobFile.update({
    where: { id: fileId },
    data: { status: FileStatus.PUBLISHING },
  })
}

export async function markFileDone(
  fileId: string,
  result: { readonly adId: string; readonly creativeId: string; readonly mediaId: string | null },
): Promise<JobFile> {
  return prisma.jobFile.update({
    where: { id: fileId },
    data: {
      status: FileStatus.DONE,
      progress: 1,
      adId: result.adId,
      creativeId: result.creativeId,
      mediaId: result.mediaId,
    },
  })
}

export async function markFileFailed(fileId: string, error: string): Promise<JobFile> {
  return prisma.jobFile.update({
    where: { id: fileId },
    data: { status: FileStatus.FAILED, error },
  })
}

export async function reconcileJobStatus(jobId: string): Promise<Job> {
  const job = await prisma.job.findUniqueOrThrow({
    where: { id: jobId },
    include: { files: true },
  })
  const stillRunning = job.files.some(
    (f) => f.status !== FileStatus.DONE && f.status !== FileStatus.FAILED,
  )
  if (stillRunning) {
    return job
  }
  const anyFailed = job.files.some((f) => f.status === FileStatus.FAILED)
  const next: JobStatus = anyFailed ? JobStatus.FAILED : JobStatus.DONE
  return prisma.job.update({ where: { id: jobId }, data: { status: next } })
}

export async function cancelQueuedFilesForJob(jobId: string): Promise<void> {
  await prisma.$transaction([
    prisma.jobFile.updateMany({
      where: { jobId, status: { in: [FileStatus.QUEUED, FileStatus.UPLOADING] } },
      data: { status: FileStatus.FAILED, error: 'Cancelled by user' },
    }),
    prisma.job.update({ where: { id: jobId }, data: { status: JobStatus.CANCELLED } }),
  ])
}

async function nextBatchNumberForBrand(brandId: string): Promise<number> {
  const last = await prisma.job.findFirst({
    where: { brandId },
    orderBy: { batchNumber: 'desc' },
    select: { batchNumber: true },
  })
  return (last?.batchNumber ?? 0) + 1
}
