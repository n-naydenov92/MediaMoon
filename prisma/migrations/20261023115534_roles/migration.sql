-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" TEXT[],
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleAssignment" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "brandId" TEXT,
    "marketId" TEXT,
    "scopeKey" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_workspaceId_name_key" ON "Role"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Role_id_workspaceId_key" ON "Role"("id", "workspaceId");

-- CreateIndex
CREATE INDEX "RoleAssignment_roleId_idx" ON "RoleAssignment"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "RoleAssignment_memberId_roleId_scopeKey_key" ON "RoleAssignment"("memberId", "roleId", "scopeKey");

-- CreateIndex
CREATE UNIQUE INDEX "Brand_id_workspaceId_key" ON "Brand"("id", "workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "Market_id_brandId_key" ON "Market"("id", "brandId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_id_workspaceId_key" ON "WorkspaceMember"("id", "workspaceId");

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Role" ADD CONSTRAINT "Role_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_memberId_workspaceId_fkey" FOREIGN KEY ("memberId", "workspaceId") REFERENCES "WorkspaceMember"("id", "workspaceId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_roleId_workspaceId_fkey" FOREIGN KEY ("roleId", "workspaceId") REFERENCES "Role"("id", "workspaceId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_brandId_workspaceId_fkey" FOREIGN KEY ("brandId", "workspaceId") REFERENCES "Brand"("id", "workspaceId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_marketId_brandId_fkey" FOREIGN KEY ("marketId", "brandId") REFERENCES "Market"("id", "brandId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Prisma can't express these two CHECK constraints, so they live only here.
ALTER TABLE "Role" ADD CONSTRAINT "Role_name_not_blank" CHECK (btrim("name") <> '');

-- The scope columns agree with each other and with scopeKey, as toScopeKey in
-- src/lib/access/scope.ts builds it. A market scope also names its brand, so the
-- composite keys can hold the market to its brand and the brand to the workspace.
ALTER TABLE "RoleAssignment" ADD CONSTRAINT "RoleAssignment_scope_consistent" CHECK (
  ("brandId" IS NULL AND "marketId" IS NULL AND "scopeKey" = 'workspace')
  OR ("brandId" IS NOT NULL AND "marketId" IS NULL AND "scopeKey" = 'brand:' || "brandId")
  OR ("brandId" IS NOT NULL AND "marketId" IS NOT NULL AND "scopeKey" = 'market:' || "marketId")
);

