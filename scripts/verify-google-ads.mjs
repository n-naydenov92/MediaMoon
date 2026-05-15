// One-shot diagnostic: pull Google Ads spend/conversions for the given customer IDs (last 7 days).
// Run with: node --env-file=.env.local scripts/verify-google-ads.mjs <customerId> [<customerId> ...]
// Customer IDs are the 10-digit account IDs, no dashes. Proves API access before wiring the dashboard.
const API_VERSION = 'v21'
const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const MICROS_PER_UNIT = 1_000_000

const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const clientId = process.env.GOOGLE_ADS_CLIENT_ID
const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET
const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN
const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

function num(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function isoDate(date) {
  return date.toISOString().slice(0, 10)
}

function lastSevenDays() {
  const now = new Date()
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1))
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 7))
  return { from: isoDate(start), to: isoDate(end) }
}

function sumRows(rows) {
  const totals = { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0, currency: 'EUR' }
  for (const row of rows) {
    const metrics = row.metrics ?? {}
    totals.spend += num(metrics.costMicros) / MICROS_PER_UNIT
    totals.revenue += num(metrics.conversionsValue)
    totals.conversions += num(metrics.conversions)
    totals.impressions += num(metrics.impressions)
    totals.clicks += num(metrics.clicks)
    totals.currency = row.customer?.currencyCode ?? totals.currency
  }
  return totals
}

function buildInsightsQuery(range) {
  return 'SELECT customer.currency_code, metrics.cost_micros, metrics.conversions, '
    + 'metrics.conversions_value, metrics.impressions, metrics.clicks '
    + `FROM customer WHERE segments.date BETWEEN '${range.from}' AND '${range.to}'`
}

async function getAccessToken() {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })
  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: HTTP ${response.status} ${await response.text()}`)
  }
  const json = await response.json()
  if (!json.access_token) {
    throw new Error('OAuth response contained no access_token')
  }
  return json.access_token
}

async function fetchTotals(customerId, token, range) {
  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': developerToken,
        'login-customer-id': loginCustomerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: buildInsightsQuery(range) }),
    },
  )
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${await response.text()}`)
  }
  const json = await response.json()
  return sumRows(json.results ?? [])
}

async function listAccessibleCustomers(token) {
  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers:listAccessibleCustomers`,
    { headers: { Authorization: `Bearer ${token}`, 'developer-token': developerToken } },
  )
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${await response.text()}`)
  }
  const json = await response.json()
  return json.resourceNames ?? []
}

async function listCustomerClients(customerId, token) {
  const query = 'SELECT customer_client.id, customer_client.descriptive_name, '
    + 'customer_client.manager, customer_client.level, customer_client.status, '
    + 'customer_client.currency_code FROM customer_client'
  const response = await fetch(
    `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': developerToken,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    },
  )
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${await response.text()}`)
  }
  const json = await response.json()
  return json.results ?? []
}

const missing = [
  ['GOOGLE_ADS_DEVELOPER_TOKEN', developerToken],
  ['GOOGLE_ADS_CLIENT_ID', clientId],
  ['GOOGLE_ADS_CLIENT_SECRET', clientSecret],
  ['GOOGLE_ADS_REFRESH_TOKEN', refreshToken],
  ['GOOGLE_ADS_LOGIN_CUSTOMER_ID', loginCustomerId],
].filter(([, value]) => !value).map(([name]) => name)

if (missing.length > 0) {
  console.error(`ERROR: missing env vars: ${missing.join(', ')}`)
  process.exit(1)
}

const customerIds = process.argv.slice(2)
const accessToken = await getAccessToken()

if (customerIds.length === 0) {
  const accessible = await listAccessibleCustomers(accessToken)
  console.log('\n=== Accessible customers for this OAuth user ===')
  if (accessible.length === 0) {
    console.log('  (none — this OAuth user can reach no Google Ads accounts)')
  }
  for (const resourceName of accessible) {
    const rootId = resourceName.split('/')[1]
    console.log(`\n  ${resourceName} — account tree:`)
    try {
      const clients = await listCustomerClients(rootId, accessToken)
      for (const row of clients) {
        const c = row.customerClient ?? {}
        const kind = c.manager ? 'manager' : 'account'
        const name = c.descriptiveName ?? '(no name)'
        console.log(`    L${c.level} ${c.id} [${kind}] ${name} ${c.currencyCode ?? ''} ${c.status ?? ''}`)
      }
    } catch (err) {
      console.log(`    (could not list children: ${err.message})`)
    }
  }
  process.exit(0)
}

const range = lastSevenDays()
console.log(`\n=== Google Ads verification — ${range.from} → ${range.to} ===`)

for (const customerId of customerIds) {
  try {
    const totals = await fetchTotals(customerId, accessToken, range)
    console.log(`\n=== Customer ${customerId} ===`)
    console.log(`  Currency:    ${totals.currency}`)
    console.log(`  Spend:       ${totals.spend.toFixed(2)}`)
    console.log(`  Revenue:     ${totals.revenue.toFixed(2)}`)
    console.log(`  Conversions: ${totals.conversions}`)
    console.log(`  Impressions: ${totals.impressions.toLocaleString()}`)
    console.log(`  Clicks:      ${totals.clicks.toLocaleString()}`)
  } catch (err) {
    console.error(`\n=== Customer ${customerId} ===`)
    console.error(`  ERROR: ${err.message}`)
  }
}
