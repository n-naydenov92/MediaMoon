// Meta refuses to publish new ads once a Page reaches its running/in-review ad limit
// (250 for these Pages). Warn early so a bulk publish doesn't silently fail midway.
const PAGE_AD_LIMIT = 250
const PAGE_AD_WARNING_ABOVE = 200

export type PageAdLoadColor = 'success' | 'warning' | 'error'

export function triggerPlaceholder(selectedCount: number, singleName: string | null): string {
  if (selectedCount === 0) {
    return 'Select pages…'
  }
  if (selectedCount === 1 && singleName) {
    return singleName
  }
  return `${selectedCount} selected pages`
}

export function pageAdLoadColor(activeAds: number): PageAdLoadColor {
  if (activeAds >= PAGE_AD_LIMIT) {
    return 'error'
  }
  if (activeAds > PAGE_AD_WARNING_ABOVE) {
    return 'warning'
  }
  return 'success'
}

export function formatActiveAds(count: number): string {
  return `${count} active ${count === 1 ? 'ad' : 'ads'}`
}
