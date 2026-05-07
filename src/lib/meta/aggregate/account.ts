import { convertToEur } from '../fx'

export interface AccountSummary {
  readonly accountId: string
  readonly accountName: string
  readonly spendEur: number
  readonly revenueEur: number
  readonly roas: number
  readonly activeAdsCount: number
}

export function summarizeAccount(
  account: { readonly id: string; readonly name: string; readonly currency: string },
  spend: number,
  revenue: number,
  activeAdsCount: number,
): AccountSummary {
  const spendEur = convertToEur(spend, account.currency)
  const revenueEur = convertToEur(revenue, account.currency)
  return {
    accountId: account.id,
    accountName: account.name,
    spendEur,
    revenueEur,
    roas: spendEur > 0 ? revenueEur / spendEur : 0,
    activeAdsCount,
  }
}
