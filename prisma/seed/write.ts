import type { Prisma } from '@/generated/prisma/client'
import type { OwnerProfile } from './clerk'
import type { AdAccountPlan, BrandPlan, ConnectionPlan, WorkspacePlan } from './plan'

type Tx = Prisma.TransactionClient

interface WorkspaceScope {
  readonly tx: Tx
  readonly workspaceId: string
  // brandId:code → market id, filled while the brands are written.
  readonly marketIds: Map<string, string>
}

// Every write creates the row only when it is missing and never updates it, so a
// rerun is a no-op and never overwrites what people changed later in the app.
export async function writeOwners(tx: Tx, owners: readonly OwnerProfile[]): Promise<readonly string[]> {
  const userIds: string[] = []
  for (const owner of owners) {
    const user = await tx.user.upsert({
      where: { clerkUserId: owner.clerkUserId },
      create: owner,
      update: {},
    })
    userIds.push(user.id)
  }
  return userIds
}

export async function writeWorkspace(tx: Tx, plan: WorkspacePlan, ownerIds: readonly string[]): Promise<void> {
  const workspace = await tx.workspace.upsert({
    where: { slug: plan.slug },
    create: { slug: plan.slug, name: plan.name },
    update: {},
  })
  const scope: WorkspaceScope = { tx, workspaceId: workspace.id, marketIds: new Map() }
  await writeOwnerMemberships(scope, ownerIds)
  for (const brand of plan.brands) {
    await writeBrand(scope, brand)
  }
  for (const connection of plan.connections) {
    await writeConnection(scope, connection)
  }
}

async function writeOwnerMemberships(scope: WorkspaceScope, userIds: readonly string[]): Promise<void> {
  for (const userId of userIds) {
    await scope.tx.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: scope.workspaceId, userId } },
      create: { workspaceId: scope.workspaceId, userId, isOwner: true },
      update: {},
    })
  }
}

async function writeBrand(scope: WorkspaceScope, brand: BrandPlan): Promise<void> {
  const { markets, ...fields } = brand
  await scope.tx.brand.upsert({
    where: { id: brand.id },
    create: { ...fields, slug: brand.id, workspaceId: scope.workspaceId },
    update: {},
  })
  for (const market of markets) {
    const row = await scope.tx.market.upsert({
      where: { brandId_code: { brandId: brand.id, code: market.code } },
      create: { brandId: brand.id, code: market.code, name: market.name },
      update: {},
    })
    scope.marketIds.set(marketKey(brand.id, market.code), row.id)
  }
}

async function writeConnection(scope: WorkspaceScope, connection: ConnectionPlan): Promise<void> {
  await scope.tx.connection.upsert({
    where: { id: connection.id },
    create: {
      id: connection.id,
      workspaceId: scope.workspaceId,
      brandId: connection.brandId,
      provider: connection.provider,
      label: connection.label,
      config: connection.config,
      secretEnvVars: { ...connection.secretEnvVars },
    },
    update: {},
  })
  for (const account of connection.adAccounts) {
    await writeAdAccount(scope, connection, account)
  }
}

async function writeAdAccount(scope: WorkspaceScope, connection: ConnectionPlan, account: AdAccountPlan): Promise<void> {
  const { workspaceId } = scope
  const { provider } = connection
  await scope.tx.adAccount.upsert({
    where: { workspaceId_provider_externalId: { workspaceId, provider, externalId: account.externalId } },
    create: {
      workspaceId,
      provider,
      connectionId: connection.id,
      externalId: account.externalId,
      marketId: account.marketCode ? scope.marketIds.get(marketKey(account.brandId, account.marketCode)) : null,
    },
    update: {},
  })
}

function marketKey(brandId: string, code: string): string {
  return `${brandId}:${code}`
}
