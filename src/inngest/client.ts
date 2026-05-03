import { Inngest } from 'inngest'

export const META_ADS_PUBLISH_EVENT = 'meta-ads/publish.start' as const

export interface MetaAdsPublishEventData {
  readonly jobId: string
  readonly accountId: string
}

export const inngest = new Inngest({ id: 'mediamon' })
