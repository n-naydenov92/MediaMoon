import 'server-only'
import { currentUser } from '@clerk/nextjs/server'
import { getDb } from '@/lib/db/client'

/**
 * Stores a person the first time they reach the app, from their Clerk profile. It never
 * makes them a member of anything: access comes only from an invitation.
 */
export async function ensureUser(clerkUserId: string): Promise<void> {
  const profile = await currentUser()
  if (!profile || profile.id !== clerkUserId) {
    return
  }
  const details = {
    email: profile.primaryEmailAddress?.emailAddress ?? '',
    name: profile.fullName,
    imageUrl: profile.imageUrl,
  }
  // The where and create keys match, so Prisma runs one INSERT … ON CONFLICT and two
  // first requests arriving together can't both fail.
  await getDb().user.upsert({ where: { clerkUserId }, create: { clerkUserId, ...details }, update: {} })
}
