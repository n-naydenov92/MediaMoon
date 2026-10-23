import { loadEnvConfig } from '@next/env'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { parseSeedArgs } from './seed/args'
import { findClerkUsers, type OwnerProfile } from './seed/clerk'
import { resolveSeedEnvironment } from './seed/environment'
import { assertSecretNamesAllowed, buildSeedPlan, type WorkspacePlan } from './seed/plan'
import { writeOwners, writeWorkspace } from './seed/write'

// Moves today's brands, markets and connections into the database, with the
// given people as owners of every workspace. Run once per environment.

// Generous: every row goes in one transaction, all together or not at all, and
// a Free-plan database may first need a few seconds to wake up.
const TRANSACTION_TIMEOUT_MS = 120_000
const TRANSACTION_MAX_WAIT_MS = 30_000

loadEnvConfig(process.cwd())

async function main(): Promise<void> {
  const args = parseSeedArgs(process.argv.slice(2))
  const env = resolveSeedEnvironment(args)
  console.log(`Seeding ${env.databaseHost} (target: ${args.target})`)
  const owners = await findClerkUsers(args.owners, env.clerkSecretKey)
  const plan = buildSeedPlan()
  assertSecretNamesAllowed(plan)
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: env.databaseUrl }) })
  try {
    await writePlan(db, plan, owners)
  } finally {
    await db.$disconnect()
  }
  printSummary(plan, owners)
}

async function writePlan(
  db: PrismaClient,
  plan: readonly WorkspacePlan[],
  owners: readonly OwnerProfile[],
): Promise<void> {
  await db.$transaction(async (tx) => {
    const ownerIds = await writeOwners(tx, owners)
    for (const workspace of plan) {
      await writeWorkspace(tx, workspace, ownerIds)
    }
  }, { timeout: TRANSACTION_TIMEOUT_MS, maxWait: TRANSACTION_MAX_WAIT_MS })
}

function printSummary(plan: readonly WorkspacePlan[], owners: readonly OwnerProfile[]): void {
  console.log(`Owners: ${owners.map((owner) => owner.email).join(', ')}`)
  for (const workspace of plan) {
    const brands = workspace.brands.map((brand) => brand.id).join(', ')
    const accounts = workspace.connections.reduce((sum, c) => sum + c.adAccounts.length, 0)
    console.log(`${workspace.name}: ${brands} · ${workspace.connections.length} connections · ${accounts} ad accounts`)
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
