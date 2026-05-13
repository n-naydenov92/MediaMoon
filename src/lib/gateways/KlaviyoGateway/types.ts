export interface KlaviyoBucketTotals {
  readonly recipients: number
  readonly delivered: number
  readonly opensUnique: number
  readonly clicksUnique: number
  readonly conversions: number
  readonly conversionValue: number
}

export interface KlaviyoRangeResult {
  readonly campaigns: KlaviyoBucketTotals
  readonly flows: KlaviyoBucketTotals
}
