---
name: frontend-design
description: Design principles for luxury fintech SaaS dashboards. Use when building UI for internal business tools, data dashboards, or operator consoles that need to feel premium, calm, and information-dense. Pairs with MUI v5.
---

# Frontend Design — Luxury Fintech SaaS Dashboards

## Philosophy

A dashboard for professionals is not a landing page. It is a **tool**. It must
reward prolonged use, scale from one screen to a hundred, and never distract
from the data.

Three operating principles:

1. **Content first.** The data is the product. Chrome should disappear.
2. **Calm by default.** Motion, color and shadow are expensive — spend them on
   what matters (state changes, user actions), never on decoration.
3. **Density without clutter.** Show more, but never at the cost of readability.
   Rhythm and whitespace carry as much weight as the data.

Avoid generic AI-era aesthetics: glassmorphism gradients, floating blobs,
random neon, pastel cartoons, playful illustrations. A tool for operators
should feel like a Bloomberg terminal re-imagined by Linear.

---

## Visual Identity

### Theme

- **Dark is the default.** Operators stare at these screens for hours — dark
  mode reduces fatigue and makes data pop.
- **Light mode exists but is secondary.** It must match the dark mode's
  information density — not just a color inversion.

### Palette (dark mode)

```
--bg-base        #0A0A0F   // near-black, not pure black
--bg-surface     #12121A   // cards, drawers
--bg-elevated    #1A1A24   // hovered cards, menus
--border-subtle  #22222E
--border-strong  #2E2E3E

--text-primary   #F5F5F7
--text-secondary #9A9AA8
--text-muted     #5A5A6A

--accent         #6C63FF   // electric indigo — primary action
--accent-hover   #7D75FF

// Semantic — use sparingly, only for data/status
--viral          #F59E0B   // amber
--hot            #F97316   // orange
--normal         #64748B   // blue-grey
--success        #10B981
--error          #EF4444
--warning        #EAB308
```

### Typography

- **Syne** — headings, numbers, logo. Distinctive, slightly geometric.
- **DM Sans** — body, labels, tables. Highly legible at small sizes.

**Scale:**

| Role        | Font      | Size | Weight | Usage                              |
|-------------|-----------|------|--------|------------------------------------|
| display     | Syne      | 32   | 700    | Page titles, hero numbers          |
| h1          | Syne      | 24   | 600    | Module name                        |
| h2          | Syne      | 20   | 600    | Section headings                   |
| h3          | DM Sans   | 16   | 600    | Card titles                        |
| body        | DM Sans   | 14   | 400    | Default paragraph, list items      |
| body-sm     | DM Sans   | 13   | 400    | Metadata, dense tables             |
| caption     | DM Sans   | 12   | 500    | Labels, badges, timestamps         |
| mono        | JetBrains | 13   | 400    | IDs, URLs, code-ish data           |

**Numerals:** always tabular (`font-variant-numeric: tabular-nums`). Numbers
must line up in columns.

### Spacing Scale

Use a **4px base**. Allowed values: `4, 8, 12, 16, 24, 32, 48, 64`.
Nothing else. No `17px`, no `22px`.

### Radii

- `4px` — buttons, chips, small controls
- `8px` — inputs, cards
- `12px` — large surface cards, modals
- Never `0` (too brutal), never `>16` (too friendly).

### Shadows

Dark-mode shadows are almost never shadows — they are **borders + elevation
via background shift**. Use `border-subtle` at rest, `border-strong` on hover,
`bg-elevated` on the element.

Reserve actual drop shadows for: modal, dropdown menu, toast. One shadow token:
`shadow-overlay: 0 12px 48px rgba(0, 0, 0, 0.5)`.

---

## Layout Rules

### App shell

```
┌──────────┬────────────────────────────────────────────┐
│ Sidebar  │  Topbar (sticky, 56px)                     │
│  (220px, ├────────────────────────────────────────────┤
│   fixed) │                                            │
│          │  Page content                              │
│          │  (max-width: 1440, centered, 24px gutter) │
│          │                                            │
└──────────┴────────────────────────────────────────────┘
```

- Sidebar: fixed 220px on desktop, 64px (icons only) on tablet, hidden on
  mobile (toggle via hamburger).
- Topbar: sticky, 56px tall. Holds: module title (left), status/refresh
  (right). Never full-width navigation here — that belongs in the sidebar.
- Content max-width 1440px. On ultrawide, center with equal gutters; don't
  stretch to infinity.

### Grid

12-column grid, 24px gutter, 24px outer padding. Use MUI `Grid` or CSS Grid —
never flex-wrap for primary layout.

### Responsive breakpoints (MUI defaults, keep them)

- `xs` < 600  — mobile, single column, sidebar hidden
- `sm` ≥ 600  — mobile-landscape / small tablet
- `md` ≥ 900  — tablet, sidebar collapsed
- `lg` ≥ 1200 — desktop, sidebar full
- `xl` ≥ 1536 — large desktop

---

## MUI Usage — Which Component for Which Pattern

| UI Pattern              | MUI Component                   | Notes                                    |
|-------------------------|---------------------------------|------------------------------------------|
| App navigation (side)   | `Drawer` (variant="permanent")  | Custom styling via `sx` or styled()      |
| App navigation (top)    | `AppBar` + `Toolbar`            | `position="sticky"`, elevation={0}       |
| Primary nav (tabs)      | `Tabs` + `Tab`                  | `variant="standard"`, underline style    |
| Content container       | `Card` + `CardContent`          | No shadow, border only                   |
| Status chip             | `Chip`                          | Custom colors via theme extension        |
| Action button           | `Button` / `IconButton`         | `variant="contained"` for primary only   |
| Helpful text            | `Tooltip`                       | `placement="top"`, arrow                 |
| Loading skeleton        | `Skeleton`                      | Match the shape of the eventual content  |
| Error state             | `Alert` (`severity="error"`)    | Never a toast for critical errors        |
| Transient feedback      | `Snackbar` + `Alert`            | Auto-hide 4s for success, sticky errors  |
| Filters / toggles       | `ToggleButtonGroup`             | Only when ≥2 options; hide if 1          |
| Data table              | `Table` or TanStack + MUI cells | Tabular nums, zebra off, row hover on    |
| Modal / dialog          | `Dialog`                        | Max 560px wide, never full-screen desktop|
| Menu                    | `Menu` + `MenuItem`             | Anchor to trigger, not to page           |

**Forbidden:**
- `Paper` with default elevation (too "Material-y"). Override to `elevation={0}`.
- Floating Action Buttons. This is a tool, not a phone app.
- Stepper wizards for workflows ≤3 steps.

---

## Motion

Motion is a **language**, not decoration. It answers: "what just happened?"
and "where did this come from?"

**Allowed motion:**

- **Navigation transitions** — tab switch, drawer open. 160ms, ease-out.
- **State reveals** — expanding a row, opening a menu. 200ms, ease-out.
- **Skeleton → content** — crossfade 120ms.
- **Hover** — border color, bg-surface → bg-elevated. 80ms. No scale, no lift.

**Forbidden motion:**

- Animating data values (counters, chart bars) on load. Data should appear
  immediately — animation delays cognition.
- Page-entry animations. A tool opens instantly.
- Spring physics on anything. Reserve for touch gestures only.
- Parallax. Ever.
- Loading spinners that spin indefinitely. Use Skeleton for content shape;
  Spinner only for button-scoped ≤1s actions.

Durations cap at **250ms**. Longer than that and it's a delay, not a transition.

---

## Density

**Default density is compact.** Operators want data, not padding.

- Table row height: 40px
- List item height: 44px
- Button height (md): 36px
- Input height (md): 40px
- Card padding: 20px (not MUI's default 16 or 24)

Mobile switches to comfortable density automatically (+4px on touch targets).

**Whitespace rules:**

- 32px between sections (top-level dividers)
- 24px between cards in a row
- 16px between related elements in a card
- 8px between a label and its value

---

## Color Semantics (Data States)

Never use color decoratively. Every color is a **signal**.

| State     | Token    | When to use                                      |
|-----------|----------|--------------------------------------------------|
| viral     | `#F59E0B`| Cluster coverage ≥5 articles                     |
| hot       | `#F97316`| Cluster coverage ≥3 and <5                       |
| normal    | `#64748B`| Everything else                                  |
| success   | `#10B981`| Positive outcomes, completed actions             |
| error     | `#EF4444`| Failures, destructive actions                    |
| warning   | `#EAB308`| Stale data, approaching limits                   |
| accent    | `#6C63FF`| Primary action, brand, selected state            |

**Two rules:**
1. Never use the accent for anything other than brand/selection/primary CTA.
2. Never use a semantic color (success/error/warning) for styling — only for
   state signaling. A blue button is not "info", it's just a button.

---

## Icons

- MUI Icons (outlined variant) by default.
- 20px in buttons, 24px in navigation, 16px inline with text.
- Monochrome. Never two-tone. Never emoji in place of icons in UI (only in
  user content).

---

## Empty, Loading, Error States

Every async surface has **three** states beyond the happy path. Design all
three.

### Loading
MUI `Skeleton` components matching the final shape. No spinners, no "Loading..."
text, no blurred placeholders.

### Empty
Small illustration optional (line art, monochrome). Headline + one-line
explanation + primary action button. Never a sad-robot.

### Error
MUI `Alert severity="error"`. Headline: what happened in human terms ("Couldn't
load news sources"). Body: what the user can do ("Try refreshing. If this
persists, contact support."). Never raw error messages or stack traces.

---

## Accessibility (Non-Negotiable)

- Contrast: WCAG AA minimum (4.5:1 body, 3:1 large text). Test every color
  pair in both themes.
- Focus rings: visible on all interactive elements. `outline: 2px solid
  var(--accent); outline-offset: 2px`.
- Keyboard navigation: Tab cycles every control. Esc closes modals/menus.
  Enter activates focused buttons.
- ARIA: only where HTML semantics aren't enough. Prefer `<button>` over
  `<div role="button">`.
- Respect `prefers-reduced-motion`. Disable all transitions if set.

---

## Self-Check Before Shipping UI

Walk through this list before declaring a screen "done":

1. Does every async region have loading / error / empty states?
2. Is every color on the screen a signal, not decoration?
3. Can the screen be used with keyboard only?
4. Does it work at 375px wide (iPhone SE)?
5. Do all numbers use tabular numerals?
6. Is there any motion longer than 250ms? If so, why?
7. Did I use elevation/shadow where a border would do?
8. Are the spacings all from the 4px scale?
9. Would this screen make sense to someone staring at it for 8 hours?
10. If I showed this to a senior designer at Linear, Stripe, or Vercel, would
    they squint?
