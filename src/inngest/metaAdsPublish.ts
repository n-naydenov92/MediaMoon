import { NonRetriableError } from 'inngest'
import { FileStatus, type CtaType } from '@prisma/client'
import { inngest, META_ADS_PUBLISH_EVENT, type MetaAdsPublishEventData } from './client'
import { getMetaTokenForAccount } from '@/config/metaTokens'
import {
  createAd,
  createAdCreative,
  uploadImage,
  uploadVideo,
} from '@/lib/gateways/MetaAdsGateway'
import { downloadBlob } from '@/lib/meta/blobStorage'
import {
  getJobWithFiles,
  markFileDone,
  markFileFailed,
  markFilePublishing,
  markJobRunning,
  reconcileJobStatus,
} from '@/lib/meta/jobs'

const FUNCTION_ID = 'meta-ads-publish'
const PER_ACCOUNT_CONCURRENCY = 3

type StepTools = Parameters<Parameters<typeof inngest.createFunction>[1]>[0]['step']

interface JobContext {
  readonly accountId: string
  readonly adSetId: string
  readonly pageId: string
  readonly copyHeadline: string
  readonly copyBody: string
  readonly copyUrl: string
  readonly copyCta: CtaType
}

interface FileContext {
  readonly id: string
  readonly originalName: string
  readonly blobUrl: string | null
}

export const metaAdsPublishFn = inngest.createFunction(
  {
    id: FUNCTION_ID,
    name: 'Publish Meta Ads batch',
    triggers: [{ event: META_ADS_PUBLISH_EVENT }],
    concurrency: { key: 'event.data.accountId', limit: PER_ACCOUNT_CONCURRENCY },
    retries: 2,
  },
  async ({ event, step }) => {
    const { jobId } = event.data as MetaAdsPublishEventData
    // eslint-disable-next-line no-console -- temporary diagnostic logging for Meta publish smoke test
    console.log(`[meta-ads worker] start jobId=${jobId}`)

    const job = await step.run('load-job', () => getJobWithFiles(jobId))
    if (!job) {
      throw new NonRetriableError(`Job ${jobId} not found`)
    }
    await step.run('mark-running', () => markJobRunning(jobId))

    const token = getMetaTokenForAccount(job.accountId)
    if (!token) {
      // eslint-disable-next-line no-console -- temporary diagnostic logging for Meta publish smoke test
      console.error(`[meta-ads worker] no token for accountId=${job.accountId}`)
      throw new NonRetriableError(`Meta token not configured for account ${job.accountId}`)
    }

    const eligibleFiles = job.files.filter(
      (f) => f.status === FileStatus.UPLOADED && f.blobUrl !== null,
    )
    // eslint-disable-next-line no-console -- temporary diagnostic logging for Meta publish smoke test
    console.log(`[meta-ads worker] accountId=${job.accountId} eligibleFiles=${eligibleFiles.length}`)

    await Promise.all(eligibleFiles.map((file) => processFile(token, job, file, step)))

    await step.run('reconcile', () => reconcileJobStatus(jobId))
  },
)

async function processFile(
  token: string,
  job: JobContext,
  file: FileContext,
  step: StepTools,
): Promise<void> {
  const baseId = `file-${file.id}`
  try {
    await step.run(`${baseId}-publishing`, () => markFilePublishing(file.id))

    const mediaResult = await step.run(`${baseId}-upload-to-meta`, async () => {
      if (!file.blobUrl) {
        throw new NonRetriableError(`File ${file.id} has no blobUrl`)
      }
      const { bytes, mimeType } = await downloadBlob(file.blobUrl)
      const isVideo = mimeType.startsWith('video/')
      if (isVideo) {
        const result = await uploadVideo(token, job.accountId, bytes, file.originalName, mimeType)
        return { kind: 'video' as const, id: result.id }
      }
      const result = await uploadImage(token, job.accountId, bytes, file.originalName, mimeType)
      return { kind: 'image' as const, hash: result.hash }
    })

    const creative = await step.run(`${baseId}-creative`, () =>
      createAdCreative(token, {
        accountId: job.accountId,
        headline: job.copyHeadline,
        bodyText: job.copyBody,
        destinationUrl: job.copyUrl,
        ctaType: job.copyCta,
        pageId: job.pageId,
        imageHash: mediaResult.kind === 'image' ? mediaResult.hash : undefined,
        videoId: mediaResult.kind === 'video' ? mediaResult.id : undefined,
      }),
    )

    const ad = await step.run(`${baseId}-ad`, () =>
      createAd(token, job.accountId, job.adSetId, creative.id, job.copyHeadline),
    )

    await step.run(`${baseId}-done`, () =>
      markFileDone(file.id, {
        adId: ad.id,
        creativeId: creative.id,
        mediaId: mediaResult.kind === 'video' ? mediaResult.id : null,
      }),
    )
    // eslint-disable-next-line no-console -- temporary diagnostic logging for Meta publish smoke test
    console.log(`[meta-ads worker] file=${file.id} DONE adId=${ad.id} creativeId=${creative.id}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // eslint-disable-next-line no-console -- temporary diagnostic logging for Meta publish smoke test
    console.error(`[meta-ads worker] file=${file.id} FAILED: ${message}`)
    await step.run(`${baseId}-failed`, () => markFileFailed(file.id, message))
  }
}
