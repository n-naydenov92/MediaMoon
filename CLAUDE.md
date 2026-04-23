# MediaMon — Project Intelligence File

## What Is This?

**MediaMon** is an internal business control hub — a single login, single dashboard from which a team manages all recurring business operations. The long-term ambition is to productize it: make it generic enough to spin up for other businesses that follow proven operational playbooks.

Today it is a **Next.js 16 / React 19 / MUI 5 / Clerk** web app deployed on Vercel. No database yet — Vercel cache is the persistence layer until Prisma + Postgres arrives.

---

## Vision

> "Instead of logging into 1,000 places, you have one control hub from which you manage your business."

Modules planned or in progress:

| Module | Status | Description |
|---|---|---|
| Trending News | Live (v1) | AI-curated media monitoring across multiple topics |
| Data Table | Planned | The table Viktor asked for — as a UI module |
| Email Automation | Planned | Automated email workflows |
| Video Generator | Planned | Create videos from prompts |
| *(anything else)* | Open | Any process that can be automated lives here |

Long-term: if the system proves itself internally, it gets formatted into a product that can be sold to or replicated for other businesses — using processes that have been validated to work.

---

## Module 1 — Trending News (Current Focus)

### What It Does

Monitors news across multiple topics. An AI layer analyzes incoming articles and decides which ones are **Trending** (logic: if 5+ sources wrote about the same thing → it's trending). Results are surfaced per topic tab.

### Topic Tabs

- **Overview** — aggregate of all topics, with a "Top Picks" highlight section (like a news homepage)
- **Stoichkov** — subtabs: Bulgaria / Spain / Worldwide
- **Shtonova** — Bulgaria only, same structure
- More tabs can be added via config with zero structural changes

### The Core Problem (Why This Is Hard)

Google blocks scraping tools. Getting real-time, multi-region news data requires:

- **Multiple rotating IPs** — to avoid bans
- **Real-time data** — most tools deliver with 12–24 h delay; useless for trending detection
- **Region coverage** — different tools cover different markets (BG, ES, US, etc.)
- **Depth** — free Google tiers return ~2 out of 10 articles; you miss trending signals

**Solution found:** a paid tool at $49/month that solves all of the above.

### The Cost Problem (Why Naive Usage Burns Money)

Using the $49/month tool naively (one request per user per load) destroys the quota in days if 10 people use it. The implemented solution:

1. **Morning cold load** — fresh data fetched once at session start
2. **Cache TTL 3–6 hours** — all users share one cached response
3. **Cache invalidation button** — manual "refresh now" that bypasses TTL; triggers a single new request, not one per user
4. **No-op on stale cache** — if cache is still valid and no new articles exist, the quota counter does not increment

This means 10 concurrent users = 1 API call per cache window, not 10.

### Current Cost Stack

| Service | Cost |
|---|---|
| News data tool | $49 / month |
| Claude AI (article analysis) | ~$0.005–0.006 per request |
| Vercel hosting | TBD |

---

## Architecture

### Stack

- **Framework:** Next.js 16.2
- **UI:** React 19 + MUI 5
- **Auth:** Clerk 6 (role-based module access)
- **AI:** Claude API (article trending analysis)
- **Cache:** Vercel edge cache (interim persistence)
- **Future DB:** Prisma + Postgres

### Key Patterns

**Gateway Pattern** — the only places that know about external services:
- `src/lib/gateways/RssGateway.ts`
- `src/lib/gateways/ClusteringGateway.ts`
- `src/lib/gateways/TrendsGateway.ts`
- `src/lib/pipeline.ts` — orchestrates the above

**Module Registry** — `src/config/modules.ts` drives sidebar, root redirect, and Clerk role checks. Adding a module = one entry here + one folder + one API route.

**Context Triad** (per module):
- `trendingNewsCtx.ts` — context shape
- `TrendingNewsProvider.tsx` — provider
- `useTrendingNewsContext.ts` — hook

**AsyncState<T>** — discriminated union in `src/types/index.ts`. Used everywhere instead of boolean loading flags.

### Open-Closed Principle (OCP) — Non-negotiable

New module:
```
src/config/modules.ts       ← add entry
src/modules/<id>/           ← new folder
src/app/api/<id>/           ← new API route
Clerk dashboard             ← new role
```
Nothing else changes.

New tab inside Trending News:
```
src/modules/trending-news/config.ts  ← add entry
```
Nothing else changes.

---

## Working Agreements

- **TypeScript strict** — no `any`, no shortcuts
- **No comments explaining WHAT** — code names do that; comments only for non-obvious WHY
- **No premature abstraction** — three similar lines beat a wrong abstraction
- **Skills first** — read `skills/*/SKILL.md` before implementing
- **ADRs for architectural decisions** — write them, don't just decide

---

## Cost Philosophy

The target is to stay far below $1,000/month in service costs while matching the productivity of tools that cost that much. Every new external service must justify its quota cost and have a caching/batching strategy before it goes live.

Splitting a $100/month Claude plan between collaborators is on the table if it unlocks enough automation value.
