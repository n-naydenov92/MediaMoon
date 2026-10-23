const CLERK_API = 'https://api.clerk.com/v1'

export interface OwnerProfile {
  readonly clerkUserId: string
  readonly email: string
  readonly name: string | null
  readonly imageUrl: string | null
}

interface ClerkUser {
  readonly id: string
  readonly first_name: string | null
  readonly last_name: string | null
  readonly image_url: string | null
}

// Read-only. Every owner must already have an account in this Clerk instance,
// otherwise the seed stops, so no workspace is ever created without its owners.
export async function findClerkUsers(
  emails: readonly string[],
  secretKey: string,
): Promise<readonly OwnerProfile[]> {
  return Promise.all(emails.map((email) => findClerkUser(email, secretKey)))
}

async function findClerkUser(email: string, secretKey: string): Promise<OwnerProfile> {
  const url = `${CLERK_API}/users?email_address=${encodeURIComponent(email)}`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${secretKey}` } })
  if (!response.ok) {
    throw new Error(`Clerk lookup failed for ${email}: HTTP ${response.status}`)
  }
  const [user] = (await response.json()) as readonly ClerkUser[]
  if (!user) {
    throw new Error(`${email} has no account in this Clerk instance`)
  }
  return { clerkUserId: user.id, email, name: fullName(user), imageUrl: user.image_url }
}

function fullName(user: ClerkUser): string | null {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ')
  return name.length > 0 ? name : null
}
