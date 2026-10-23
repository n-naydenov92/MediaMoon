import { loadEnvConfig } from '@next/env'
import { defineConfig } from 'prisma/config'

// The CLI reads the same env files as Next (.env.local locally, the project's
// env vars on Vercel), so local commands can only reach the dev branch.
loadEnvConfig(process.cwd())

// Migrations need a direct connection; the pooled one is for the app at runtime.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL_UNPOOLED,
  },
})
