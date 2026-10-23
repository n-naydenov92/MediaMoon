import type { SeedArgs, SeedTarget } from './args'

export interface SeedEnvironment {
  readonly databaseUrl: string
  readonly databaseHost: string
  readonly clerkSecretKey: string
}

const CLERK_KEY_PREFIX: Readonly<Record<SeedTarget, string>> = {
  dev: 'sk_test_',
  production: 'sk_live_',
}

// Environments are paired and never mixed: the dev Clerk instance with the dev
// branch, production Clerk with main. The Clerk key must match the target, and
// the run must name the database host, so a stale env var in the shell can't
// write one environment's users into the other's database.
export function resolveSeedEnvironment(args: SeedArgs): SeedEnvironment {
  const databaseUrl = requireEnv('DATABASE_URL_UNPOOLED')
  const clerkSecretKey = requireEnv('CLERK_SECRET_KEY')
  const databaseHost = new URL(databaseUrl).hostname
  const expectedPrefix = CLERK_KEY_PREFIX[args.target]
  if (!clerkSecretKey.startsWith(expectedPrefix)) {
    throw new Error(`--target=${args.target} needs a Clerk secret key that starts with ${expectedPrefix}`)
  }
  if (args.host !== databaseHost) {
    throw new Error(`--host does not match the database in DATABASE_URL_UNPOOLED (${databaseHost})`)
  }
  return { databaseUrl, databaseHost, clerkSecretKey }
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not set`)
  }
  return value
}
