export type {
  AdAccount,
  AdCreativeElements,
  AdCreativeParams,
  AdInsightsFilter,
  AdSet,
  AdSetDetail,
  AdWithCreativeElements,
  AdWithInsights,
  AccountInsights,
  AttributionEventType,
  AttributionWindow,
  BudgetType,
  CampaignBudget,
  DeviceMode,
  DsaEntities,
  PlacementSelection,
  Gender,
  Pixel,
  TargetingBasics,
  Campaign,
  CtaType,
  InsightsDailyPoint,
  InsightsTotals,
  InstagramAccount,
  Page,
  PublishAdResult,
} from './types'

export { CTA_TYPES } from './types'

export { MetaApiError } from './graphErrors'
export type { MetaFailureReason } from './graphErrors'
export type {
  MetaUsage,
  ThrottleInfo,
  ThrottleScope,
  UsageMeter,
} from './rateLimit'

export { fetchMetaUsage } from './usageApi'

export {
  countActiveAdsForPage,
  countActiveAdsInAccount,
  createAdSet,
  duplicateAdSet,
  fetchAdAccounts,
  fetchAdSets,
  fetchCampaigns,
  fetchDsaEntities,
  fetchInstagramAccountsForPage,
  fetchPages,
} from './accountsApi'

export type { StatusFilter } from './accountsApi'

export { accountStatusInfo, canAccountServeAds } from './accountStatus'
export type { AccountStatusInfo, AccountStatusTone } from './accountStatus'

export { fetchAdSet, fetchPixels } from './targetingApi'

export { fetchAccountInsights } from './insightsApi'

export {
  fetchAdsWithInsights,
  fetchAdElementsWithInsights,
  fetchRankedAdInsights,
  fetchElementsForAdIds,
} from './adsApi'

export type { RankedAdInsightsRow } from './adsApi'

export {
  createAd,
  createAdCreative,
  uploadImage,
  uploadVideo,
} from './publishApi'

export { fetchAdPreview } from './previewApi'
export type { AdPreview, EmbeddedGraphError } from './previewApi'

export {
  startVideoUpload,
  transferVideoChunk,
  finishVideoUpload,
  fetchVideoSource,
} from './videoUploadApi'

export type {
  VideoUploadStart,
  VideoUploadTransfer,
} from './videoUploadApi'
