export function buildAdsManagerHref(accountId: string, adId: string): string {
  const cleanAccountId = accountId.replace(/^act_/, '')
  const params = new URLSearchParams({
    act: cleanAccountId,
    selected_ad_ids: adId,
    date_preset: 'maximum',
  })
  return `https://business.facebook.com/adsmanager/manage/ads/edit?${params.toString()}`
}

export function buildAdSetHref(accountId: string, adSetId: string): string {
  const cleanAccountId = accountId.replace(/^act_/, '')
  const params = new URLSearchParams({
    act: cleanAccountId,
    selected_adset_ids: adSetId,
    date_preset: 'maximum',
  })
  return `https://business.facebook.com/adsmanager/manage/adsets/edit?${params.toString()}`
}
