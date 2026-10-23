# ADR 0003 — Access control: owners, custom roles and scopes

- **Status:** Accepted, 2026-10-23
- **Related:** [ADR 0002](0002-multi-tenancy.md) (workspaces, brands and markets). The rules live in `src/lib/access/`.

## Context

Today's access model doesn't fit a product other teams run on their own:
- Every person has one Clerk role in `publicMetadata` (`admin`, `team`, `creative_analyst`, `bubullincas`).
- Two allowlists in `src/config/brandAccess.ts` limit some roles to some brands.
- The Edge middleware checks module roles, and API routes trust it.

The product needs three things:
- Every workspace defines its own roles.
- Access can be limited to one brand or one market.
- Nobody can hand out more access than they have.

## Decision

1. **The database is the only source of access.** Clerk only says who the person is.
2. **Owner is the only built-in role** (`WorkspaceMember.isOwner`).
   - Owners may do everything in their workspace.
   - Three actions are owner-only and never part of a role: deleting the workspace, managing billing, and adding or removing owners.
3. **Every other role is custom and belongs to one workspace:** a name and a set of permission keys.
   - The catalog of permissions lives in code (`permissions.ts`); the database stores only the keys.
   - A key the catalog doesn't know grants nothing, so dropping a permission from the catalog revokes it everywhere.
4. **Permissions have a level, roles have a scope.**
   - Every permission is workspace-, brand- or market-level.
   - A role is given at a scope: the whole workspace, one brand or one market.
   - A role carries only permissions at its own level or below:

   | Role given at | Takes effect |
   |---|---|
   | Workspace | Every permission, everywhere in the workspace |
   | Brand | Brand and market permissions, in that brand only |
   | Market | Market permissions, in that market only |

   - So someone with access to one market never sees the brand's totals (revenue, GA4).
   - A brand permission asked about a market is answered for that market's brand.
   - A market permission held in one market doesn't count as held for the whole brand.
5. **No escalation.**
   - Creating or editing a role needs `roles.manage`. Every permission in the role must be one the editor holds across the workspace. Editing checks the role before and after the change, so nobody can touch a role stronger than their own access.
   - Giving a role needs `members.manage`. Every permission that takes effect at the chosen scope must be one the giver holds there.
   - Taking a role away follows the same rule as giving it.
   - So no role ends up stronger than the access of whoever made or gave it.
6. **A workspace always has an owner.** The last owner can't leave, be removed or stop being an owner. The check runs in the same transaction as the change.
7. **Fail closed.** No membership, an unknown key or missing data all mean no.
8. **The rules are pure functions with unit tests.**
   - The server loads one `AccessContext` per request (memberships and role assignments) and passes it in.
   - The rules never read the database themselves.
   - Someone signed in for the first time gets a `User` row and no access. Only an invitation makes them a member.
   - On a developer's machine, `ACCESS_DEV_ROLE` lets an owner see the app as one of their custom roles. It works only under `next dev`, never on Vercel, and only narrows access.
9. **Access is enforced where data is fetched, by filtering.**
   - Guards return only the markets and accounts the person may use, so "All markets" means "all of mine".
   - Layouts, pages and API routes check access, following Next.js's Data Access Layer approach.
   - The middleware ends up only checking that the person is signed in.
10. **The switch leaves no gap.**
    - The rules come first.
    - Next comes a shadow mode that computes the new decision, logs any difference from today's Clerk roles, and still serves the old one.
    - Then the switch. Clerk roles are removed after it.

## Consequences

- **The database enforces the shape of access.**
  - Composite foreign keys keep every role assignment inside one workspace, and a market inside its brand.
  - CHECK constraints keep the scope columns consistent and refuse a blank role name.
  - A role, brand or market in use can't be deleted.
  - So a bug in a server action can't hand out access across workspaces.
- **Every request needs the access context.** It is one query, shared within the request through `cache()`.
- **Market-level access needs ownership checks on Meta writes.** Before changing a campaign or ad set, the server checks that it belongs to an allowed ad account, which costs one more Meta read per write.
- **The catalog is code.** Adding a permission needs a deploy. Renaming a key drops it from every role unless a migration renames the stored keys too.
- **The role editor must follow the same rules.** It shows only permissions the editor holds, and warns when a role holds permissions that won't take effect at the chosen scope.
- **Server Actions are public endpoints.** Each one checks its own permission, and a test fails when an API route has no access rule.
