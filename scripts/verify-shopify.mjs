// One-shot diagnostic: pull Shopify orders for the last 7 days per brand and print totals.
// Run with: node --env-file=.env.local scripts/verify-shopify.mjs
const BRANDS = [
  {
    id: 'stoitchkov',
    label: 'Stoitchkov Nutrition',
    urlVar: 'SHOPIFY_URL_STOITCHKOV',
    tokenVar: 'SHOPIFY_TOKEN_STOITCHKOV',
  },
]

const API_VERSION = '2024-10'
const ORDERS_PER_PAGE = 250
const MAX_PAGES = 200
const MIN_INTERVAL_MS = 600
const ORDER_FIELDS =
  'id,line_items,created_at,total_price,total_shipping_price_set,currency'

function dayString(d) {
  return new Date(d).toISOString().slice(0, 10)
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

const today = new Date()
const sevenDaysAgo = new Date(today.getTime() - 7 * 86_400_000)
const dateMin = dayString(sevenDaysAgo)
const dateMax = dayString(today)

for (const brand of BRANDS) {
  const storeUrlRaw = process.env[brand.urlVar]
  const token = process.env[brand.tokenVar]
  if (!storeUrlRaw || !token) {
    console.log(`\n=== ${brand.label} ===`)
    console.log(`  (env vars missing: ${brand.urlVar} / ${brand.tokenVar})`)
    continue
  }
  const storeUrl = storeUrlRaw.replace(/\/+$/, '')

  const initialParams = new URLSearchParams({
    status: 'any',
    created_at_min: `${dateMin}T00:00:00Z`,
    created_at_max: `${dateMax}T23:59:59Z`,
    limit: String(ORDERS_PER_PAGE),
    fields: ORDER_FIELDS,
  })
  let url = `${storeUrl}/admin/api/${API_VERSION}/orders.json?${initialParams.toString()}`

  let totalOrders = 0
  let totalRevenue = 0
  let pages = 0
  let lastSentAt = 0
  let lastCallLimit = ''

  try {
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
        const total = parseAmount(order.total_price)
        const shipping = parseAmount(order.total_shipping_price_set?.shop_money?.amount)
        totalRevenue += total - shipping
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

    console.log(`\n=== ${brand.label} (${storeUrl}) ===`)
    console.log(`  Window: ${dateMin} → ${dateMax}`)
    console.log(`  Pages fetched: ${pages}`)
    console.log(`  Orders: ${totalOrders.toLocaleString()}`)
    console.log(`  Revenue (total - shipping, raw currency): ${totalRevenue.toFixed(2)}`)
    console.log(`  Last X-Shopify-Shop-Api-Call-Limit: ${lastCallLimit}`)
  } catch (err) {
    console.error(`\n=== ${brand.label} (${storeUrl}) ===`)
    console.error(`  ERROR: ${err.message}`)
  }
}
