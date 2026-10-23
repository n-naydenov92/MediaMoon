import 'server-only'
import { configSource } from './configSource'
import type { TenancySource } from './types'

// The one switch between the config files and the database. Rolling the switch
// back is reverting the change to this line.
export const activeSource: TenancySource = configSource
