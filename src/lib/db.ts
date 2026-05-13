import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line vars-on-top, @typescript-eslint/naming-convention -- standard Prisma global singleton pattern for dev hot-reload
  var __prismaClient: PrismaClient | undefined
}

export const prisma: PrismaClient = globalThis.__prismaClient ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prismaClient = prisma
}
