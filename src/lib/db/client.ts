import 'server-only'
import { PrismaPg } from '@prisma/adapter-pg'
import { attachDatabasePool } from '@vercel/functions'
import { Pool } from 'pg'
import { PrismaClient } from '@/generated/prisma/client'

// A short idle timeout, so a suspended function holds no idle connections
// (Vercel's pooling guidance for Fluid compute).
const IDLE_TIMEOUT_MS = 5_000

// One client per process. The dev server re-evaluates modules on every edit, and
// without this each edit would open another pool against the database.
const globalForDb = globalThis as typeof globalThis & { mediamonDb?: PrismaClient }

export function getDb(): PrismaClient {
  globalForDb.mediamonDb ??= createDb()
  return globalForDb.mediamonDb
}

function createDb(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
  }
  const pool = new Pool({ connectionString, idleTimeoutMillis: IDLE_TIMEOUT_MS })
  attachDatabasePool(pool)
  return new PrismaClient({ adapter: new PrismaPg(pool) })
}
