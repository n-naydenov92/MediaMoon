import { parseArgs } from 'node:util'

export type SeedTarget = 'dev' | 'production'

export interface SeedArgs {
  readonly owners: readonly string[]
  readonly target: SeedTarget
  readonly host: string
}

const USAGE = 'Usage: npm run db:seed -- --target=dev|production --host=<database host> --owners=<email>,<email>'

export function parseSeedArgs(argv: readonly string[]): SeedArgs {
  const { values } = parseArgs({
    args: [...argv],
    options: {
      owners: { type: 'string' },
      target: { type: 'string' },
      host: { type: 'string' },
    },
  })
  const owners = parseEmails(values.owners ?? '')
  if (owners.length === 0 || !isSeedTarget(values.target) || !values.host) {
    throw new Error(USAGE)
  }
  return { owners, target: values.target, host: values.host }
}

function parseEmails(raw: string): readonly string[] {
  return raw.split(',').map((email) => email.trim().toLowerCase()).filter((email) => email.length > 0)
}

function isSeedTarget(value: unknown): value is SeedTarget {
  return value === 'dev' || value === 'production'
}
