# Project Roles & Access Control (RBAC)

Canonical reference for the role-based access system. Roles live in **Clerk**
(`publicMetadata.role`), not in the database. This document maps every role to its access and
points at every place in the code that enforces it.

> This whole layer is slated for a refactor — see [Known refactor debt](#known-refactor-debt).

## Roles → access matrix

| Role | Brands | Modules / scope |
|---|---|---|
| `admin` | all (incl. Bubullincas) | everything |
| `team` | all **except Bubullincas** | Dashboard, Advertising (Meta Ads + Google Ads), Trending News |
| `stoichkov_only` | all **except Bubullincas** | Dashboard + Trending News only |
| `shtonova_only` | all **except Bubullincas** | Dashboard + Trending News only |
| `creative_analyst` | all **except Bubullincas** | Locked by middleware to the **Meta Ads → Performance** sub-path + the brand picker only |
| `bubullincas` | **only Bubullincas** | Dashboard + Advertising (**Meta Ads only** — no Google Ads, no Trending News) |

### Brand visibility — two allowlists, combined

`canRoleAccessBrand(role, brandId)` in `src/config/brandAccess.ts` is the AND of two checks:

- **Role side** (`ROLE_BRAND_ALLOWLIST`): roles *absent* see every brand; a *listed* role is
  restricted to its brands. Only `bubullincas` is listed (→ only the Bubullincas brand).
- **Brand side** (`BRAND_ROLE_ALLOWLIST`): brands *absent* are visible to every role; a *listed*
  brand is visible ONLY to its roles. Only `bubullincas` is listed (→ `admin` + `bubullincas`),
  making it a **private brand**.

Net effect: Bubullincas is visible only to `admin` and the `bubullincas` role; the `bubullincas`
role sees nothing else.

### Important nuances (easy to conflate)

- `stoichkov_only` / `shtonova_only` are **topic scopes inside Trending News**, *not* brand
  scopes. The "except Bubullincas" above is the brand-side rule, not a topic rule.
- `creative_analyst` is restricted by **path** (a single screen), enforced in `src/middleware.ts`;
  its brand visibility comes from the same `canRoleAccessBrand` check as everyone else.
- The brand gate in middleware runs for **every** authenticated role (before the
  `creative_analyst` path branch), so private-brand access is denied uniformly — page redirect or
  API 403.

## Where each concern lives

| Concern | File(s) |
|---|---|
| Role list / type | `src/types/index.ts` — `UserRole` union + `ALL_ROLES` |
| Parse a raw claim → role | `src/lib/roles.ts` — `parseRole` |
| Resolve the current user's role | `src/lib/currentUserRole.ts` — reads `sessionClaims.role`, falls back to `publicMetadata.role` |
| Module access | `src/config/modules.ts` — `MODULE_REGISTRY[].roles` (+ `getModulesForRole`, `findModuleById`) |
| Sidebar visibility | `src/config/sidebarNav.ts` — `ROLES_*` constants on each nav item |
| Brand access | `src/config/brandAccess.ts` — `ROLE_BRAND_ALLOWLIST` (role→brands) + `BRAND_ROLE_ALLOWLIST` (brand→roles), combined in `canRoleAccessBrand`; `getAccessibleBrands` |
| Enforcement — routing | `src/middleware.ts` — module gate, brand gate (page redirect + **API 403**), `creative_analyst` sub-path lock |
| Enforcement — brand guard | `src/app/brands/[brandId]/layout.tsx` — server guard covering all brand sub-routes |
| Enforcement — module guards | `src/app/brands/[brandId]/(advertising)/layout.tsx`, `src/app/brands/[brandId]/[moduleId]/page.tsx` |
| Brand-list filtering (UI) | `src/app/layout.tsx` (brand switcher) + `src/app/brands/page.tsx` (brands grid) — both via `getAccessibleBrands` |
| Role storage | Clerk `publicMetadata.role` + the session-token `role` claim |

## How a request is gated (flow)

1. **`middleware.ts`** runs first: signs-in check → resolve role from `sessionClaims` →
   brand-access gate for **every** role (page redirect or API 403, resolving the target brand
   from `?brandId=`, or from `?accountId=` via `getBusinessManagerForAccount`) →
   `creative_analyst` path lock → module-route role check.
2. **Server layouts/pages** re-validate on render: `[brandId]/layout.tsx` redirects if the role
   can't access the brand; `(advertising)/layout.tsx` and `[moduleId]/page.tsx` redirect if the
   role lacks the module.
3. **UI filtering** hides what the role can't reach: the brand switcher and `/brands` grid only
   list `getAccessibleBrands(role, …)`.

## Adding a new role

1. Add the id to `UserRole` + `ALL_ROLES` in `src/types/index.ts`.
2. Grant module access in `src/config/modules.ts` and sidebar visibility in
   `src/config/sidebarNav.ts`.
3. (Optional) Restrict the role to specific brands via `ROLE_BRAND_ALLOWLIST`, and/or make a
   brand private to specific roles via `BRAND_ROLE_ALLOWLIST` — both in `src/config/brandAccess.ts`.
4. Assign `publicMetadata.role = "<id>"` to the user in the Clerk dashboard.

## Known refactor debt

- The brand + role guard logic is repeated across the three layout/page files → extract a
  shared `requireBrandAccess(brandId)` server helper.
- API brand-authorization lives **only** in `middleware.ts` → move it to the resource gate
  (`src/lib/meta/resolveBrandToken.ts`) so each route validates its own permission rather than
  trusting the routing layer.
- `modules.ts` uses inline role arrays while `sidebarNav.ts` uses named `ROLES_*` constants →
  unify the style.
- Two parallel module route trees exist (`/modules/*` and `/brands/[brandId]/[moduleId]`) →
  consolidate.
