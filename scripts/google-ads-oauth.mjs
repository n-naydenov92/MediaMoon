// One-off helper: runs the Google Ads OAuth installed-app flow and prints a refresh token.
// Prerequisites in .env.local:
//   GOOGLE_ADS_CLIENT_ID     — from GCP Credentials (OAuth client ID, type "Desktop app")
//   GOOGLE_ADS_CLIENT_SECRET — from the same OAuth client
// Run with:  node --env-file=.env.local scripts/google-ads-oauth.mjs
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { exec } from 'node:child_process'
import { platform } from 'node:os'

const CLIENT_ID = process.env.GOOGLE_ADS_CLIENT_ID
const CLIENT_SECRET = process.env.GOOGLE_ADS_CLIENT_SECRET

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: GOOGLE_ADS_CLIENT_ID and GOOGLE_ADS_CLIENT_SECRET must be in .env.local')
  process.exit(1)
}

const PORT = 8765
const REDIRECT_URI = `http://localhost:${PORT}/callback`
const SCOPE = 'https://www.googleapis.com/auth/adwords'
const STATE = randomBytes(16).toString('hex')

const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
authUrl.searchParams.set('client_id', CLIENT_ID)
authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
authUrl.searchParams.set('response_type', 'code')
authUrl.searchParams.set('scope', SCOPE)
authUrl.searchParams.set('access_type', 'offline')
authUrl.searchParams.set('prompt', 'consent')
authUrl.searchParams.set('state', STATE)

console.log('\n=== Google Ads OAuth helper ===')
console.log(`Listening on  ${REDIRECT_URI}`)
console.log('Opening browser for sign-in. If it does not open, copy the URL below:\n')
console.log(authUrl.toString())
console.log('')

openInBrowser(authUrl.toString())

const server = createServer(async (req, res) => {
  if (!req.url || !req.url.startsWith('/callback')) {
    res.writeHead(404).end('Not found')
    return
  }
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    finish(res, 400, `Auth error: ${error}`)
    console.error(`\nAuth error: ${error}`)
    server.close()
    process.exit(1)
  }
  if (!code || state !== STATE) {
    finish(res, 400, 'Bad request — missing code or state mismatch.')
    server.close()
    process.exit(1)
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    finish(res, 200, 'Done. You can close this tab and return to the terminal.')
    server.close()

    console.log('\n=== Tokens received ===')
    if (!tokens.refresh_token) {
      console.error('No refresh_token in response. Re-run with prompt=consent (already set) and ensure the account has not previously authorised this client.')
      process.exit(1)
    }
    console.log('\nAdd this to .env.local AND Vercel env vars:\n')
    console.log(`GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}\n`)
    console.log('(access_token expires in 1h, refresh_token does not expire — keep it secret.)')
    process.exit(0)
  } catch (err) {
    finish(res, 500, `Token exchange failed: ${err.message}`)
    console.error(`\nToken exchange failed: ${err.message}`)
    server.close()
    process.exit(1)
  }
})

server.listen(PORT, () => {
  console.log(`Waiting for Google redirect on port ${PORT}...`)
})

async function exchangeCodeForTokens(code) {
  const body = new URLSearchParams({
    code,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  })
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text}`)
  }
  return response.json()
}

function finish(res, status, message) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!doctype html><meta charset="utf-8"><title>Google Ads OAuth</title><body style="font-family:system-ui;padding:40px;max-width:600px"><h2>${message}</h2></body>`)
}

function openInBrowser(url) {
  const cmd = platform() === 'win32'
    ? `start "" "${url}"`
    : platform() === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`
  exec(cmd, (err) => {
    if (err) {
      console.log('(Could not auto-open browser — copy the URL above manually.)')
    }
  })
}
