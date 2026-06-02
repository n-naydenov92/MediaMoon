// Diagnostic: probe Meta API for DSA beneficiary/payor entity lists.
// Run with: node --env-file=.env.local scripts/verify-meta-dsa.mjs

const ACCOUNTS = [
  { envVar: 'META_TOKEN_SAPPHIRE', accountId: 'act_734480455547742', label: 'Sapphire (primary)' },
  { envVar: 'META_TOKEN_THEGREENBEAR', accountId: 'act_222478775571065', label: 'TheGreenBear (primary)' },
]

const API_VERSION = 'v21.0'
const BASE = `https://graph.facebook.com/${API_VERSION}`

async function call(path, token, params = {}) {
  const u = new URL(`${BASE}${path}`)
  u.searchParams.set('access_token', token)
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v)
  const res = await fetch(u.toString())
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

function preview(obj) {
  return JSON.stringify(obj, null, 2).slice(0, 1500)
}

for (const { envVar, accountId, label } of ACCOUNTS) {
  const token = process.env[envVar]
  console.log(`\n\n======================== ${label} (${accountId}) ========================`)
  if (!token) {
    console.log(`  SKIP: env var ${envVar} missing`)
    continue
  }

  console.log('\n--- [1] account → business{id,name} ---')
  const acc = await call(`/${accountId}`, token, { fields: 'id,name,business{id,name}' })
  console.log(`  HTTP ${acc.status}`)
  console.log(`  ${preview(acc.json)}`)
  const businessId = acc.json?.business?.id

  if (businessId) {
    console.log(`\n--- [2] business-level probes for ${businessId} ---`)
    for (const fld of ['dsa_payors', 'dsa_beneficiaries', 'business_dsa_payors', 'business_dsa_beneficiaries']) {
      const r = await call(`/${businessId}`, token, { fields: `id,${fld}` })
      console.log(`  fields=${fld} → HTTP ${r.status}  ${preview(r.json)}`)
    }
    for (const edge of ['dsa_payors', 'dsa_beneficiaries', 'dsa_payer_options', 'dsa_beneficiary_options']) {
      const r = await call(`/${businessId}/${edge}`, token)
      console.log(`  edge ${edge} → HTTP ${r.status}  ${preview(r.json)}`)
    }
  } else {
    console.log('  (no business id — account is personal or token lacks business permission)')
  }

  console.log('\n--- [3] aggregate from existing adsets (fallback B) ---')
  const ads = await call(`/${accountId}/adsets`, token, {
    fields: 'id,dsa_beneficiary,dsa_payor',
    limit: '200',
  })
  if (ads.json?.data) {
    const ben = new Set()
    const pay = new Set()
    for (const a of ads.json.data) {
      if (a.dsa_beneficiary) ben.add(a.dsa_beneficiary)
      if (a.dsa_payor) pay.add(a.dsa_payor)
    }
    console.log(`  ${ads.json.data.length} adsets → beneficiaries: ${JSON.stringify([...ben])}`)
    console.log(`                   payors:        ${JSON.stringify([...pay])}`)
  } else {
    console.log(`  ${preview(ads.json)}`)
  }
}

console.log('\n\nDone.')
