import 'server-only'
import type { GoogleAdsCredentials } from '@/config/googleAdsAccounts'
import { readSecret } from './secrets'

// One set for every brand today: all customers sit under a single manager account.
// The developer token is app-level; the rest moves to a per-workspace connection.
export async function resolveGoogleAdsCredentials(): Promise<GoogleAdsCredentials | null> {
  const developerToken = readSecret('GOOGLE_ADS_DEVELOPER_TOKEN')
  const clientId = readSecret('GOOGLE_ADS_CLIENT_ID')
  const clientSecret = readSecret('GOOGLE_ADS_CLIENT_SECRET')
  const refreshToken = readSecret('GOOGLE_ADS_REFRESH_TOKEN')
  const loginCustomerId = readSecret('GOOGLE_ADS_LOGIN_CUSTOMER_ID')
  if (!developerToken || !clientId || !clientSecret || !refreshToken || !loginCustomerId) {
    return null
  }
  return { developerToken, clientId, clientSecret, refreshToken, loginCustomerId }
}
