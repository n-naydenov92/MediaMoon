import 'server-only'
import { readBrandContext, readBrands } from './db/brands'
import {
  readAnalyticsProvider,
  readCommerceProvider,
  readKlaviyoProvider,
  readMetaConnectionForAccount,
  readMetaConnections,
} from './db/connections'
import type { TenancySource } from './types'

// The database as a tenancy source (ADR 0002).
export const dbSource: TenancySource = {
  readBrands,
  readBrandContext,
  readMetaConnections,
  readMetaConnectionForAccount,
  readCommerceProvider,
  readAnalyticsProvider,
  readKlaviyoProvider,
}
