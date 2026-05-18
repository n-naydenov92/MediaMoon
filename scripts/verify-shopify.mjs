// One-shot diagnostic: exchange Shopify Client ID + Secret for an access token via
// client_credentials grant, then pull last 7 days of orders per brand and print totals.
// Run with: node --env-file=.env.local scripts/verify-shopify.mjs
const BRANDS = [
  {
    id: 'stoitchkov',
    label: 'Stoitchkov Nutrition',
    urlVar: 'SHOPIFY_URL_STOITCHKOV',
    clientIdVar: 'SHOPIFY_CLIENT_ID_STOITCHKOV',
    clientSecretVar: 'SHOPIFY_CLIENT_SECRET_STOITCHKOV',
    timezone: 'Europe/Sofia',
  },
]

const API_VERSION = '2024-10'
const ORDERS_PER_PAGE = 250
const MAX_PAGES = 200
const MIN_INTERVAL_MS = 600
const ORDER_FIELDS =
  'id,line_items,created_at,total_price,current_total_price,currency'

function dayString(d) {
  return new Date(d).toISOString().slice(0, 10)
}

function timezoneOffsetForDate(dateStr, timezone) {
  const reference = new Date(`${dateStr}T12:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'longOffset',
  }).formatToParts(reference)
  const offsetName = parts.find((part) => part.type === 'timeZoneName')?.value ?? ''
  const match = offsetName.match(/GMT([+-]\d{2}:\d{2})/)
  return match ? match[1] : '+00:00'
}

function parseAmount(raw) {
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') {
    const n = Number.parseFloat(raw)
    return Number.isFinite(n) ? n : 0
  }
  return 0
}

function parseNextPageInfo(linkHeader) {
  if (!linkHeader) return null
  for (const part of linkHeader.split(',')) {
    const match = part.match(/<([^>]+)>;\s*rel="next"/)
    if (match) return new URL(match[1]).searchParams.get('page_info')
  }
  return null
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function exchangeForAccessToken(storeUrl, clientId, clientSecret) {
  const response = await fetch(`${storeUrl}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'client_credentials',
    }),
  })
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`token grant HTTP ${response.status}: ${body || response.statusText}`)
  }
  const data = await response.json()
  if (!data.access_token) {
    throw new Error('token grant: missing access_token in response')
  }
  return { token: data.access_token, expiresIn: data.expires_in }
}

const today = new Date()
const sevenDaysAgo = new Date(today.getTime() - 7 * 86_400_000)
const dateMin = dayString(sevenDaysAgo)
const dateMax = dayString(today)

for (const brand of BRANDS) {
  const storeUrlRaw = process.env[brand.urlVar]
  const clientId = process.env[brand.clientIdVar]
  const clientSecret = process.env[brand.clientSecretVar]
  if (!storeUrlRaw || !clientId || !clientSecret) {
    console.log(`\n=== ${brand.label} ===`)
    console.log(`  (env vars missing: ${brand.urlVar} / ${brand.clientIdVar} / ${brand.clientSecretVar})`)
    continue
  }
  const storeUrl = storeUrlRaw.replace(/\/+$/, '')

  try {
    const { token, expiresIn } = await exchangeForAccessToken(storeUrl, clientId, clientSecret)
    console.log(`\n=== ${brand.label} (${storeUrl}) ===`)
    console.log(`  Token: ${token.slice(0, 14)}... (expires in ${expiresIn}s)`)
    console.log(`  Window: ${dateMin} → ${dateMax}`)

    const initialParams = new URLSearchParams({
      status: 'any',
      created_at_min: `${dateMin}T00:00:00.000${timezoneOffsetForDate(dateMin, brand.timezone)}`,
      created_at_max: `${dateMax}T23:59:59.999${timezoneOffsetForDate(dateMax, brand.timezone)}`,
      limit: String(ORDERS_PER_PAGE),
      fields: ORDER_FIELDS,
    })
    let url = `${storeUrl}/admin/api/${API_VERSION}/orders.json?${initialParams.toString()}`

    let totalOrders = 0
    let totalRevenue = 0
    let pages = 0
    let lastSentAt = 0
    let lastCallLimit = ''

    while (url && pages < MAX_PAGES) {
      const wait = MIN_INTERVAL_MS - (Date.now() - lastSentAt)
      if (wait > 0) await sleep(wait)
      lastSentAt = Date.now()

      const response = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': token,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}: ${body || response.statusText}`)
      }
      const json = await response.json()
      const orders = json.orders ?? []
      for (const order of orders) {
        totalOrders += 1
        totalRevenue +=
          order.current_total_price !== undefined
            ? parseAmount(order.current_total_price)
            : parseAmount(order.total_price)
      }
      lastCallLimit = response.headers.get('x-shopify-shop-api-call-limit') ?? 'n/a'
      const nextPageInfo = parseNextPageInfo(response.headers.get('link'))
      pages += 1
      if (nextPageInfo) {
        const cursorParams = new URLSearchParams({
          limit: String(ORDERS_PER_PAGE),
          fields: ORDER_FIELDS,
          page_info: nextPageInfo,
        })
        url = `${storeUrl}/admin/api/${API_VERSION}/orders.json?${cursorParams.toString()}`
      } else {
        url = null
      }
    }

    console.log(`  Pages fetched: ${pages}`)
    console.log(`  Orders: ${totalOrders.toLocaleString()}`)
    console.log(`  Revenue (current_total_price, raw currency): ${totalRevenue.toFixed(2)}`)
    console.log(`  Last X-Shopify-Shop-Api-Call-Limit: ${lastCallLimit}`)
  } catch (err) {
    console.error(`\n=== ${brand.label} (${storeUrl}) ===`)
    console.error(`  ERROR: ${err.message}`)
  }
}
