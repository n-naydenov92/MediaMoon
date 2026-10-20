// Diagnostic (read-only): for every Business Manager token — which Meta app it belongs
// to, the app's Marketing API access tier, and the current rate-limit usage.
// Run with: node --env-file=.env.local scripts/meta-usage.mjs
// Tokens are sent as a header and never printed. Keep TOKENS in sync with
// src/config/metaBusinessManagers.ts (one ad account per Business Manager is enough).

const TOKENS = [
  { envVar: 'META_TOKEN_STOITCHKOV', accountId: 'act_25619246591017712' },
  { envVar: 'META_TOKEN_SAPPHIRE', accountId: 'act_734480455547742' },
  { envVar: 'META_TOKEN_THEGREENBEAR', accountId: 'act_222478775571065' },
  { envVar: 'META_TOKEN_THEGREENBEAR_2', accountId: 'act_639771789949515' },
  { envVar: 'META_TOKEN_BUBULLINCAS', accountId: 'act_1073479967115320' },
  { envVar: 'META_TOKEN_MONITRADE', accountId: 'act_181255093815434' },
]

const API_VERSION = process.env.META_GRAPH_VERSION ?? 'v21.0'
const BASE = `https://graph.facebook.com/${API_VERSION}`
const USAGE_HEADERS = ['x-app-usage', 'x-business-use-case-usage', 'x-ad-account-usage']
const TIER_LABELS = {
  development_access: 'Limited Access (development tier: 60-point budget, 300 s block)',
  standard_access: 'Full Access',
}

async function call(path, token) {
  const res = await fetch(`${BASE}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  const json = await res.json().catch(() => ({}))
  const usage = Object.fromEntries(
    USAGE_HEADERS.map((name) => [name, res.headers.get(name)]).filter(([, value]) => value),
  )
  return { json, usage }
}

function describe(json, render) {
  if (json?.error) {
    return `ERROR ${json.error.code}/${json.error.error_subcode ?? '-'}: ${json.error.message}`
  }
  return render(json)
}

function accessTier(usage) {
  const raw = usage['x-business-use-case-usage'] ?? usage['x-ad-account-usage']
  const tier = raw?.match(/"ads_api_access_tier":"([a-z_]+)"/)?.[1]
  return tier ? `${tier} → ${TIER_LABELS[tier] ?? 'unknown tier'}` : 'not reported'
}

for (const { envVar, accountId } of TOKENS) {
  const token = process.env[envVar]
  console.log(`\n== ${envVar} (${accountId})`)
  if (!token) {
    console.log('  SKIP: env var missing')
    continue
  }
  const app = await call('/app?fields=id,name', token)
  const me = await call('/me?fields=id,name', token)
  const account = await call(`/${accountId}?fields=id,name,account_status`, token)
  console.log(`  app          : ${describe(app.json, (j) => `${j.name} (${j.id})`)}`)
  console.log(`  system user  : ${describe(me.json, (j) => `${j.name} (${j.id})`)}`)
  console.log(`  ad account   : ${describe(account.json, (j) => `${j.name}, account_status ${j.account_status}`)}`)
  console.log(`  access tier  : ${accessTier(account.usage)}`)
  console.log(`  app usage    : ${app.usage['x-app-usage'] ?? 'not reported'}`)
  console.log(`  account usage: ${account.usage['x-business-use-case-usage'] ?? 'not reported'}`)
}

console.log('\nDone.')
