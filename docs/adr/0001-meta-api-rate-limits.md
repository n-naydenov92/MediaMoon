# ADR 0001 — Meta Marketing API rate limits and authentication

- **Status:** Accepted, 2026-10-20
- **Supersedes:** `docs/meta-oauth-migration.md` (2026-04-28)

## Context

Uploading videos and banners through the Ads Creator regularly got the whole team blocked by Meta for about 5 minutes ("Application request limit reached"). The proposed fix was to replace the system-user setup with OAuth, as other ad tools do.

A read-only check on 2026-10-20 (`scripts/meta-usage.mjs`) showed:

- **One app for everything.** All six Business Manager system-user tokens belong to the same Meta app, **NaydenovGroup** (`2134481480732465`), so every brand shares one app-level budget.
- **The app is on Limited Access.** Every ad account reports `ads_api_access_tier: development_access`, which Meta documents as development-only:

  | | Limited (development) | Full Access |
  |---|---|---|
  | Short-term score per ad account (read = 1, write = 3) | 60 | 9000 |
  | Block once exhausted | 300 s | 60 s |
  | `ads_management` per hour | 300 + 40 × active ads | 100 000 + 40 × active ads |

- **One video ad nearly exhausts the budget.** A 50 MiB video ad costs 18 writes (resumable start + 13 chunks + finish + thumbnail + creative + ad), about 54 of the 60 points, so the second video triggers the 5-minute block.
- **`/me/accounts` (the Page list) counts toward the app-level limit (code 4)** for all brands at once. It was refetched, uncached, on every Ads Creator open.
- **The client amplified the problem:**
  - every page × slot job re-uploaded the same media;
  - chunks were retried up to 4× even while throttled, which extends Meta's block and raises the error rate;
  - a manual retry restarted the upload from scratch;
  - no usage headers were read.

Meta scopes these limits **per app and ad account**, not per token or user. A token obtained through OAuth for the same app gets exactly the same limits. Other tools are not blocked because their apps hold Full Access.

## Decision

1. **Keep one system user per Business Manager** for our own ad accounts. Meta recommends system users for server-to-server use, and they don't expire with a person's session.
2. **Upgrade the app to Full Access** via App Review → Permissions and Features → Marketing API Access Tier. Submitted 2026-10-20 with only the tier in the request, and **approved the same day**. All six ad accounts now report `ads_api_access_tier: standard_access`; the existing tokens did not need regenerating. Every other permission stays on Standard Access, which is enough for our own assets.
3. **Make the gateway rate-limit aware** (`src/lib/gateways/MetaAdsGateway/`). Every Graph call goes through `http.ts`, which:
   - parses `x-app-usage`, `x-business-use-case-usage` and `x-ad-account-usage`;
   - throws a typed `MetaApiError` (`reason`: throttled / transient / unreachable / rejected);
   - after a throttle, refuses further calls for that scope (app or `act_…`) locally until the block expires (`rateLimit.ts`);
   - logs `[meta-usage]` lines (path only — the query string carries the token).
4. **Use one error mapping for every route** (`src/lib/meta/metaErrorResponse.ts`): 429 + `Retry-After` for throttles, 504 for "retry now", 502 for "fix the request". 503 stays reserved for "Meta token not configured", which several clients already rely on.
5. **Make the client queue wait instead of failing.** On 429 the launch queue pauses, shows a countdown under the Publish button, and resumes on its own from the last uploaded chunk. Each media is uploaded once per ad account and shared by all pages, duplicates and later batches (`SharedMediaUploads`). A creative whose ad step failed is reused on retry. All of this lives in the open Ads Creator tab's memory: a page reload loses the queue, as it did before.
6. **Cache read-mostly metadata on the server** (`src/lib/meta/cachedMetaReads.ts`): Pages, Instagram accounts, pixels and DSA lists for 30 min, ad accounts for 10 min. Campaigns, ad sets and ads are never cached. **Reload from Meta** in the Ads Creator header (`DELETE /api/meta-ads/cache`) expires all of these lists at once.
7. **Cache the Ad Library for 5 min**, in the browser and on Vercel's CDN alike (it was 60 min plus 10 min stale on the CDN, which Refresh could not skip). Its Refresh sends `fresh=1`, which skips both caches, and the "Updated" tooltip shows when the cache expires.

## Consequences

- On Limited Access, blocks still happen but cost one paused queue instead of failed jobs. On Full Access they should be rare: 150× the budget and a 60 s block.
- The error rate that gates Full Access stays low, because we no longer call Meta while blocked.
- The guard is per server instance (no shared store), so a fresh instance may make one more call before it learns about a block. The client pause covers that case.
- New Pages, pixels or ad accounts can take up to 30 / 10 minutes to appear, unless someone clicks Reload from Meta.

## Future: multi-tenant projects (not built yet)

When users create projects and connect their own Business Managers, add **Facebook Login for Business** with **business-integration system-user tokens**. These are non-expiring and delegated per client business through Meta's asset picker. Store them encrypted per project in Postgres.

`resolveAccountTokenFromRequest` then becomes a database lookup. The gateway, the guard and the queue stay as they are, because limits are keyed by app and ad account, not by token.

That phase needs Advanced Access (App Review with a screencast of the real login flow) for `ads_management`, `ads_read`, `business_management`, `pages_show_list`, `pages_read_engagement` and `pages_manage_ads`.
