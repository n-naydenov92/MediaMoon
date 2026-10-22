# ADR 0001 — Meta Marketing API rate limits and authentication

- **Status:** Accepted, 2026-10-21
- **Supersedes:** `docs/meta-oauth-migration.md` (2026-04-28)

## Context

Uploading videos and banners through the Ads Creator regularly got the whole team blocked by Meta for about 5 minutes ("Application request limit reached"). The proposed fix was to replace the system-user setup with OAuth, as other ad tools do.

A read-only check on 2026-10-20 showed:

- **One app for everything.** All six Business Manager system-user tokens belong to the same Meta app, **NaydenovGroup** (`2134481480732465`), so every brand shares one app-level budget.
- **The app was on Limited Access.** Every ad account reported `ads_api_access_tier: development_access`, which Meta documents as development-only:

  | | Limited (development) | Full Access |
  |---|---|---|
  | Short-term score per ad account (read = 1, write = 3) | 60 | 9000 |
  | Block once exhausted | 300 s | 60 s |
  | `ads_management` per hour | 300 + 40 × active ads | 100 000 + 40 × active ads |

- **One video ad nearly exhausted the budget.** A 50 MiB video ad costs 18 writes (resumable start + 13 chunks + finish + thumbnail + creative + ad), about 54 of the 60 points, so the second video triggered the 5-minute block.
- **The client amplified the problem:** every page × slot job re-uploaded the same media, chunks were retried while throttled (which extends Meta's block), and a manual retry restarted the upload from scratch.

Meta scopes these limits **per app and ad account**, not per token or user. A token obtained through OAuth for the same app gets exactly the same limits. Other tools are not blocked because their apps hold Full Access.

A second read-only check on 2026-10-21 showed which limit each Ads Creator read counts against:

| Request | Usage header Meta returns | Raised by Full Access? |
|---|---|---|
| Pages (`/me/accounts`) | `x-app-usage` (app-level) | No |
| Ad set list (`/{campaign}/adsets`, `/act_…/adsets`) | `x-app-usage` + `x-ad-account-usage` | Only the ad-account part |
| Ad accounts, pixels, campaigns, ad set detail | `x-business-use-case-usage` → `ads_management` | Yes |
| Insights (Performance, Ad Library, Overview) | `x-business-use-case-usage` → `ads_insights` | Yes |
| Instagram account of a Page (`/{page}`) | `x-business-use-case-usage` → `pages`, `instagram` | Not tier-based |

## Decision

1. **Keep one system user per Business Manager** for our own ad accounts. Meta recommends system users for server-to-server use, and they don't expire with a person's session.
2. **Upgrade the app to Full Access** via App Review → Permissions and Features → Marketing API Access Tier. Submitted 2026-10-20 with only the tier in the request and **approved the same day**. All six ad accounts now report `ads_api_access_tier: standard_access`; the existing tokens did not need regenerating. Every other permission stays on Standard Access, which is enough for our own assets.
3. **Make the gateway rate-limit aware** (`src/lib/gateways/MetaAdsGateway/`). Every Graph call goes through `http.ts` — the ad hover preview included (`previewApi.ts`) — which:
   - parses `x-app-usage`, `x-business-use-case-usage` and `x-ad-account-usage`;
   - throws a typed `MetaApiError` (`reason`: throttled / transient / unreachable / rejected);
   - after a throttle, refuses further calls for that scope (app or `act_…`) locally until the block expires (`rateLimit.ts`);
   - retries only transient failures, and only where that is safe: reads, plus ad set create/copy;
   - logs `[meta-usage]` lines (path only — the query string carries the token).
4. **Use one error mapping for every Meta route** (`src/lib/meta/metaErrorResponse.ts`): 429 + `Retry-After` for throttles, 504 for "retry now", 502 for "fix the request", 500 for anything that isn't a Meta error. 503 stays reserved for "Meta token not configured", which several clients rely on.
5. **No shared caches for Meta data.** Data is kept only in the browser tab of the person who opened the screen, and Refresh always fetches from Meta. With Full Access a shared server or CDN cache no longer protects any limit that matters; it only shows colleagues numbers from someone else's earlier load. Pages, ad accounts, pixels, DSA values and Instagram accounts are not cached on the server.
6. **The launch queue changes are deferred** (pause on 429 with a countdown, one upload per media and ad account, resumable chunks, creative reuse on retry). They will be done one at a time.

## Consequences

- Until the queue changes land, a throttle still fails the running jobs, but each failure carries a readable reason and wait time, and retries no longer reach Meta while the block lasts.
- On Full Access, ad-account blocks should be rare: 150× the budget and a 60 s block.
- The error rate that gates Full Access stays low, because we no longer call Meta while blocked.
- The guard is per server instance (no shared store), so a fresh instance may make one more call before it learns about a block.
- The app-level limit (code 4) is not raised by the tier and is the remaining risk; the Pages list and ad set lists count against it. If `[meta-usage]` logs or 429 responses with `scope: "app"` show it being hit, cache only the Pages list.

## Future: multi-tenant projects (not built yet)

The multi-tenant model itself (workspaces, brands, markets, encrypted per-workspace credentials) is decided in [ADR 0002](0002-multi-tenancy.md).

When users create projects and connect their own Business Managers, add **Facebook Login for Business** with **business-integration system-user tokens**. These are non-expiring and delegated per client business through Meta's asset picker. Store them encrypted per project in Postgres.

`resolveAccountTokenFromRequest` then becomes a database lookup. The gateway and the guard stay as they are, because limits are keyed by app and ad account, not by token.

That phase needs Advanced Access (App Review with a screencast of the real login flow) for `ads_management`, `ads_read`, `business_management`, `pages_show_list`, `pages_read_engagement` and `pages_manage_ads`.
