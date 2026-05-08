export function buildAdsManagerHref(accountId: string, adId: string): string {
  const cleanAccountId = accountId.replace(/^act_/, '')
  const params = new URLSearchParams({
    act: cleanAccountId,
    selected_ad_ids: adId,
    date_preset: 'maximum',
  })
  return `https://business.facebook.com/adsmanager/manage/ads/edit?${params.toString()}`
}
