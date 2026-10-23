# ADR 0002 — Multi-tenancy: workspaces, brands and markets

- **Status:** Accepted, 2026-10-22
- **Related:** [ADR 0001](0001-meta-api-rate-limits.md) (Meta API rate limits and authentication). Access control (permissions, custom roles, scopes) is [ADR 0003](0003-access-control.md).

## Context

MediaMon serves one company, and that company's data is part of the code:

| Data | Where it lives today |
|---|---|
| Brands and their markets | `src/config/brands.ts` (a closed `BrandId` union), `Market` union in `src/types/index.ts` |
| Ad accounts per market, Business Managers, Google Ads customers | `src/config/adAccounts.ts`, `metaBusinessManagers.ts`, `googleAdsAccounts.ts` |
| Commerce, analytics and Klaviyo providers | `src/config/commerceProviders.ts`, `analyticsProviders.ts`, `klaviyoProviders.ts` |
| Credentials | One env var per brand or Business Manager (`META_TOKEN_*`, `WOO_*`, `KLAVIYO_API_KEY_*`, …) |
| Who may see what | Clerk `publicMetadata.role` plus two allowlists in `src/config/brandAccess.ts` |

- Adding a person or a brand means editing code, adding env vars, setting a role in the Clerk dashboard and deploying.
- About 75 files read the config modules directly. Some are client components, so every brand's ad account ids and token env var names ship to the browser.
- The goal is a product: a user signs up, creates workspaces, adds brands and markets, and invites their team, with no customer data in the code.

## Decision

1. **Hierarchy: Workspace → Brand → Market.**
   - A workspace is the umbrella and holds many brands.
   - A brand holds many markets.
   - "All" stays a virtual selection, the union of the markets the user may see, and is never stored.
2. **Postgres + Prisma.**
   - Neon, provisioned through the Vercel Marketplace, in the same region as the Vercel functions.
   - Customer data lives only in the database.
3. **Clerk is identity only:** sign-in, session and profile.
   - No Clerk roles and no Clerk Organizations. Workspaces, memberships and roles live in our database, the single source of truth.
   - Organizations were rejected because they don't support access scoped to a brand or a market, so we would need our own tables anyway. Using both would mean two sources of truth and deeper vendor lock-in for a product we intend to sell.
4. **Ownership.** Every workspace has at least one owner (`WorkspaceMember.isOwner`), and whoever creates a workspace becomes its owner.
   - A workspace may have many owners, so it is never locked when one person leaves.
   - Safeguards:
     - the last owner can't leave, be removed or stop being an owner;
     - only owners add or remove owners;
     - deleting a workspace is a soft delete, restorable for 30 days.
   - Every other role is a custom role defined per workspace (ADR 0003).
5. **The migration moves data, not people.**
   - It creates three workspaces: Naydenov Group (Stoitchkov, TheGreenBear, Sapphire), Bubullincas and Moni Trade. This grouping will be revisited.
   - Owners are passed to the migration as arguments and are never written into code.
   - Everyone else is invited through the new UI.
   - Existing screens keep using Clerk roles until the switch to database access, so nobody loses access in between.
6. **Seeded brands keep their current ids** (`stoitchkov`, `thegreenbear`, …) as primary keys.
   - URLs, `?brandId=`, localStorage keys and session cache keys keep working.
   - New brands get generated ids.
   - The URL slug is a separate column.
7. **One read path for customer data: `src/lib/tenancy/`.**
   - It is server-only and async from the start.
   - It is first backed by today's config files, then switched to Prisma behind the same API (branch by abstraction), so the ~75 consumers change once, not twice.
   - Client components get a serializable, client-safe brand context from the server layout: never env var names or secrets.
   - An ESLint rule forbids importing the config data modules anywhere else.
8. **Credentials.** Customer secrets move into the database, encrypted with AES-256-GCM under a versioned key held in env:
   - Meta system-user tokens;
   - WooCommerce, Shopify and Klaviyo keys;
   - GA4 property ids;
   - Google Ads refresh tokens.

   App-level secrets stay in env: the Meta app, the Google Ads developer token and the Google service account. During the transition the database stores only the *names* of env vars, checked against an allowlist pattern.
9. **Environments are paired and never mixed.**

   | Environment | Clerk | Database |
   |---|---|---|
   | Local (`.env.local`) | Development instance | Neon `dev` branch |
   | Vercel Production | Production instance | Neon `main` |

   - `clerkUserId` differs between Clerk instances, so each database works only with its own Clerk instance.
   - Production migrations run in the Vercel build, never from a developer machine.
10. **No shared server cache for customer data.** Only per-request `cache()`, consistent with the per-person cache rule in `CLAUDE.md` and ADR 0001.
11. **Billing is per workspace** (Stripe) and comes later. Until then, Clerk sign-up stays Restricted.

## Consequences

- **The database is on the critical path.** Every request reads tenancy and access data from Postgres, and Neon scales to zero after 5 idle minutes, so the first request after idle is slower. Mitigation: one query per request, in the same region.
- **Invisible work comes first.** The tenancy layer is a large refactor (about 75 files) that lands before any visible feature.
- **The old config files linger until the access switch.** Prisma can't run in the Edge middleware, so `src/middleware.ts` keeps reading `brands.ts` and `metaBusinessManagers.ts` until access checks move into the database (ADR 0003).
- **The encryption key becomes critical.** Losing it loses every stored customer secret, so it needs an offline backup.
- **All tenants share one Meta app limit.** The app-level limit from ADR 0001 is shared across every customer. Per-workspace quotas and monitoring must exist before the first outside customer.
- **Workspace URLs constrain new routes.** URLs move to `/[workspaceSlug]/[brandSlug]/…`, so every new top-level route must first be added to the list of reserved workspace slugs.
- **Onboarding needs no engineer.** Adding a customer, brand, market or teammate no longer needs a code change or a deploy.
