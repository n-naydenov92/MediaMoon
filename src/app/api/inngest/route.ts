import { serve } from 'inngest/next'
import { inngest } from '@/inngest/client'
import { metaAdsPublishFn } from '@/inngest/metaAdsPublish'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [metaAdsPublishFn],
})
