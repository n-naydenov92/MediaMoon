import { OAuth2Client } from 'google-auth-library'
import type { GoogleAdsCredentials } from '@/config/googleAdsAccounts'

let cachedClient: OAuth2Client | null = null

export async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string> {
  const client = resolveClient(credentials)
  const { token } = await client.getAccessToken()
  if (!token) {
    throw new Error('Google Ads: unable to obtain an OAuth access token')
  }
  return token
}

function resolveClient(credentials: GoogleAdsCredentials): OAuth2Client {
  if (cachedClient) {
    return cachedClient
  }
  const client = new OAuth2Client({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
  })
  client.setCredentials({ refresh_token: credentials.refreshToken })
  cachedClient = client
  return client
}
