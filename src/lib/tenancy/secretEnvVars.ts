// A connection stores the names of the env vars that hold its secrets. Only these
// prefixes are allowed, so no connection can point at, say, CLERK_SECRET_KEY.
const SECRET_ENV_VAR_PATTERN = /^(META_TOKEN|WOO|SHOPIFY|KLAVIYO|GA_PROPERTY_ID|GOOGLE_ADS)_[A-Z0-9_]+$/

export function isAllowedSecretEnvVar(name: string): boolean {
  return SECRET_ENV_VAR_PATTERN.test(name)
}
