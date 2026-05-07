export function buildAdsManagerHref(accountId: string, adId: string): string {
  const cleanAccountId = accountId.replace(/^act_/, '')
  return `https://business.facebook.com/adsmanager/manage/ads?act=${encodeURIComponent(cleanAccountId)}&selected_ad_ids=${encodeURIComponent(adId)}`
}
