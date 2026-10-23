# Infrastructure

How MediaMon is hosted, what it costs, which guards limit the bill and how the database is backed up. Settings below were set by hand in the Vercel and Neon dashboards; nothing in the code enforces them, so keep this page in sync when you change one.

## Where it runs

| Piece | Where | Notes |
|---|---|---|
| App | Vercel project `media-moon`, team `naydenovgroup` (Pro plan) | Functions in `iad1` (Washington, D.C.) |
| Database | Neon project `mediamon` (`little-hill-05175627`), AWS `us-east-1` | Launch plan, installed through the Vercel Marketplace and billed on the Vercel invoice |

The functions and the database must stay in the same region. Every request reads tenancy data from Postgres, so a cross-region hop would slow every page.

## Database branches

| Branch | Used by | Compute | Scale to zero |
|---|---|---|---|
| `main` | Vercel Production | 0.25–1 CU | after 5 minutes idle |
| `dev` | Local development (`.env.local`) | 0.25–0.5 CU | after 5 minutes idle |

- New branches get the project defaults: 0.25–1 CU, scale to zero after 5 minutes.
- 1 CU is about 4 GB RAM. Today the database barely uses 0.25 CU.
- The first query after an idle period waits about half a second while the compute wakes up.
- Vercel gets `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used by the Prisma CLI). Both are Sensitive and set for Production only.
- Production migrations run only in the Vercel build (`vercel.json` → `npm run db:deploy && npm run build`), never from a developer machine.

## Cost and spending guards

Expected Neon cost at today's usage is about $6–10 a month: compute at $0.106 per CU-hour, storage at $0.35 per GB-month.

| Guard | Where | Setting | Stops anything? |
|---|---|---|---|
| Compute ceiling | Neon → Postgres database → Computes → Edit | `main` 1 CU, `dev` 0.5 CU | Caps how fast compute can spend: at most ~$77 a month for `main` running flat out |
| Neon spending email | Neon → organization menu → Manage → Spending notifications | $20 threshold; email at 80% and 100% | No |
| Vercel spend management | Vercel → Settings → Billing → Spend Management | $10 on-demand budget on top of the $20 monthly credit | Yes: pauses **every** production deployment in the team, not only `media-moon` |

- Vercel's budget does **not** count Marketplace charges, so it never limits Neon.
- There is no hard stop on Neon spending. Neon offers one only as a project quota set through its API: the console never shows it, and when it triggers it suspends the database until the next billing period. We decided against it on 2026-10-23. Revisit when costs grow, and make any such limit visible.
- Neon's spend in dollars is on the Spending notifications card (refreshed every 15 minutes) and in Vercel → Storage → `mediamon` → Usage and Invoices.

### When to raise compute

Check Neon → Monitoring on a working day with **Last day** selected. On the Launch plan metrics are kept for only 3 days.

- CPU sits at the ceiling for long stretches during working hours: raise the maximum.
- Local file cache hit rate drops below about 99%: the data no longer fits in memory, so raise the maximum, and the minimum too if it stays low.
- CPU never drops below 0.25 during working hours: raise the minimum to 0.5.
- A slow first page after a pause is the compute waking up, not a sizing problem. Turning scale to zero off on `main` removes it for about $13 a month.

## Backups and restore

| Protection | Setting | Covers |
|---|---|---|
| History window | 7 days | Restoring a branch to any moment in the last 7 days |
| Scheduled snapshots | Daily at 03:00 UTC, kept 35 days | Mistakes noticed after the history window |
| Deleted project recovery | 7 days, CLI or API only (`neon projects recover <project-id>`) | Someone deleting the whole Neon project |
| Off-site backup | **Not set up yet** | Anything that takes Neon itself away. Required before inviting outside people |

- Take a manual snapshot (Neon → Backup & Restore → Create) before a risky migration.
- **Restore replaces the branch's data.** Neon keeps the previous state as a branch named `<branch> (old)`. Don't restore `main` without agreeing on it first.

Neon's maintenance window is Tuesday 06:00–07:00 UTC. Computes may restart for a few seconds.

## Access

- The Neon organization is managed by Vercel. People reach Neon only through the Vercel team: invite them in Vercel → Settings → Members, then they open Vercel → Storage → `mediamon` → **Open in Neon** once.
- Vercel Owner and Member become Neon **Admin**. Viewer and Billing become Neon **Member**.
- A Neon Member is not read-only: they can read connection strings and run SQL that changes data. Any Vercel team role therefore gives access to the database. Invite only people you would trust with it.
- Vercel Owner and Member seats cost $20 a month each. Viewer seats are free.
- People who only use the app don't need Vercel at all; they sign in through Clerk.

## Never

- **Uninstall the Neon integration** (Vercel → Integrations → Neon → Uninstall Integration). It deletes the database.
- Paste connection strings, API keys or tokens into chats, tickets or commits. When a script needs a production secret, put it in a gitignored `.env.<name>.local` file, run the script with `--env-file`, then delete the file and revoke any temporary key.
