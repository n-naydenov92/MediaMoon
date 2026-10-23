import 'server-only'

// Customer secrets are env vars named by the tenancy source today; ADR 0002 moves
// them into the database, encrypted, behind this same function.
export function readSecret(envVar: string | null): string | null {
  if (!envVar) {
    return null
  }
  const value = process.env[envVar]
  return value && value.length > 0 ? value : null
}
