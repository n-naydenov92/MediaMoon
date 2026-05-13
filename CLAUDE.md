# MediaMon — Project Intelligence File

## Hard rules (non-negotiable)

These rules are mechanical (ESLint enforces them) AND behavioural (must be followed before lint runs):

- **MUI primitives only.** No raw `<div>` / `<span>` / `<p>` / `<ul>` / `<ol>` / `<li>` / `<h1-h6>` / `<button>` / `<input>` / `<select>` in JSX. Use `Box` / `Typography` / `List` / `ListItem` / `Button` / `IconButton` / `TextField` / `Select` from `@mui/material`.
- **No `sx` prop, no inline `style={{}}`.** Styling lives exclusively in CSS modules. The only inline-style exception is CSS variables (e.g. `style={{ '--dot-color': value }}`).
- **No `!important` in CSS.** Use higher specificity (double class `.foo.foo`, chained `:global()` selectors, parent context `.parent .child`), swap component (Stack→Box), or theme overrides. The only documented exception is the `prefers-reduced-motion` a11y block in `src/styles/globals.css` — that's the canonical WCAG pattern where lower-specificity `*` selectors must override every component's animation/transition.
- **Apply `/skills/*` on every code change, no matter how small.** A 1-line edit still triggers the full skills checklist (frontend-design / react-best-practices / clean-code / senior-architect). There is no "small" change. Skipping skills = CRITICAL violation.
- Project ESLint config (`eslint.config.mjs`) extends `airbnb` + `airbnb-typescript` + `next/*` and adds `no-restricted-syntax` to fail the build on the bans above.

## Folder & file structure (non-negotiable)

The folder tree mirrors the import graph. Reading the tree tells you which components depend on which.

### Casing

| Casing | Meaning |
|---|---|
| **PascalCase folder** | The folder IS a component. Must contain `<FolderName>.tsx`. |
| **lowercase folder** | Namespace / grouping. No edge-of-folder `.tsx`. Examples: `launch/`, `overview/`, `shared/`, `hooks/`, `components/`. |
| **camelCase file** | Hook (`useFoo.ts`), helper (`helpers.ts`), utility, type module. |
| **kebab-case folder** | Top-level module namespace (`src/Section/trending-news/`, `src/app/api/meta-ads/`). Allowed only at module-root level. |

### Per-component folder rule

Every component lives in its own folder named after itself:

```
NewsBlock/
  NewsBlock.tsx                ← the component (matches folder name)
  NewsBlock.module.css         ← optional CSS module (matches .tsx)
  helpers.ts                   ← optional pure helpers (always `helpers.ts`, never `<Component>.helpers.ts`)
  NewsBlockHeader/             ← optional child component (its own folder)
    NewsBlockHeader.tsx
    NewsBlockHeader.module.css
```

**Exceptions** — Next.js routing conventions that must match Next.js names: `page.tsx`, `layout.tsx`, `route.ts`, `not-found.tsx`, `loading.tsx`, `error.tsx`, `template.tsx`, `default.tsx`. These live at the routing folder level, not inside per-component folders.

### Nesting rule

A component used by **exactly one** other component lives **inside that parent's folder**. Components used by 2+ siblings stay at the area-root level.

**Max 2 levels of component-folder nesting** below an area root. If a chain would create a depth-3 grand-child, flatten the deepest child to a sibling at depth 2.

```
launch/                          ← area root (namespace)
  LaunchAdsTab/                  ← depth 1: tab orchestrator
    LaunchAdsTab.tsx
    FilePicker/                  ← depth 2: child of LaunchAdsTab
      FilePicker.tsx
      FilePicker.module.css
    JobsPanel/                   ← depth 2
      JobsPanel.tsx
    JobRow/                      ← depth 2 (flat — would be depth 3 inside JobsPanel)
      JobRow.tsx
```

### One component per `.tsx` file

Never put two top-level React components in the same file. Each component → own file → own folder.

### Helpers

Module-scope **pure** (non-JSX) functions that aren't the component itself live in a sibling `helpers.ts`:

- File name is always `helpers.ts` (not `<Component>.helpers.ts`).
- Helper depends on a type/constant only used by it? → move the type/constant into `helpers.ts` too.
- Helper returns JSX (e.g., a Recharts tooltip render-prop factory)? → keep in `.tsx`. JSX-returning module-scope functions are mini-components.
- Side-effect utilities (e.g., DOM manipulation helpers like `lockGlobalCursor`) also go in `helpers.ts` — they're non-component module-scope functions.

### Hooks

- File name: camelCase, starts with `use` (`useTrendingFetcher.ts`).
- Placement: either alongside its sole consumer (`MyComponent/useMyComponentData.ts`) or in a `hooks/` namespace folder when shared across multiple consumers (`src/Section/trending-news/hooks/useEnsureMarketsLoaded.ts`).

### No `index.ts` barrels

Direct imports only. `import X from './Folder/X'` — never `import X from './Folder'`. The only acceptable barrels are in `src/lib/`, `src/types/`, `src/config/` (utility/data namespaces, not component trees).

### Component export pattern

```tsx
import { memo } from 'react'

interface Props {
  readonly someProp: string
}

export default memo(function ComponentName({ someProp }: Props): JSX.Element {
  return (/* ... */)
})
```

Acceptable variant for stateful root-of-page orchestrators that don't benefit from memoization:

```tsx
export default function PageOrchestrator(): JSX.Element { ... }
```

**Banned forms:**

- `export default memo((props) => ...)` — anonymous arrow inside memo.
- `const X = () => ...; export default X` — separate const + default.
- `React.FC<Props>` / `React.FunctionComponent<Props>` — use explicit `(props: Props): JSX.Element`.

### Props interfaces

- Always `readonly` on every prop.
- Local interface: `interface Props`. Exported interface (other files import it): `<ComponentName>Props`.

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
- `src/lib/gateways/WooGateway.ts` — WooCommerce REST per brand (revenue / orders / top products)
- `src/lib/gateways/GoogleAnalyticsGateway.ts` — GA4 Data API (sessions / active users) via `@google-analytics/data` + service-account JSON; per-brand property IDs in `src/config/analyticsProviders.ts`
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
