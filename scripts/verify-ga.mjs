// One-shot diagnostic: pull GA4 sessions/users for each brand for the last 7 days.
// Run with: node --env-file=.env.local scripts/verify-ga.mjs
import { BetaAnalyticsDataClient } from '@google-analytics/data'

const BRANDS = [
  { id: 'stoitchkov', label: 'Stoitchkov', envVar: 'GA_PROPERTY_ID_STOITCHKOV' },
  { id: 'thegreenbear', label: 'Thegreenbear', envVar: 'GA_PROPERTY_ID_THEGREENBEAR' },
  { id: 'sapphire', label: 'Sapphire', envVar: 'GA_PROPERTY_ID_SAPPHIRE' },
]

const json = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
if (!json) {
  console.error('ERROR: GOOGLE_SERVICE_ACCOUNT_JSON missing from env')
  process.exit(1)
}

const credentials = JSON.parse(json)
const client = new BetaAnalyticsDataClient({ credentials })

for (const brand of BRANDS) {
  const propertyId = process.env[brand.envVar]
  if (!propertyId) {
    console.log(`\n=== ${brand.label} ===\n  (no property ID)`)
    continue
  }
  try {
    const [response] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    })
    const rows = response.rows ?? []
    let totalSessions = 0
    let totalUsers = 0
    for (const row of rows) {
      totalSessions += Number.parseInt(row.metricValues?.[0]?.value ?? '0', 10)
      totalUsers += Number.parseInt(row.metricValues?.[1]?.value ?? '0', 10)
    }
    console.log(`\n=== ${brand.label} (property ${propertyId}) ===`)
    console.log(`  Days returned: ${rows.length}`)
    console.log(`  Total sessions: ${totalSessions.toLocaleString()}`)
    console.log(`  Total active users: ${totalUsers.toLocaleString()}`)
    if (rows.length > 0) {
      console.log(`  Sample first row: date=${rows[0].dimensionValues?.[0]?.value} sessions=${rows[0].metricValues?.[0]?.value} users=${rows[0].metricValues?.[1]?.value}`)
    }
  } catch (err) {
    console.error(`\n=== ${brand.label} (property ${propertyId}) ===`)
    console.error(`  ERROR: ${err.message}`)
  }
}
