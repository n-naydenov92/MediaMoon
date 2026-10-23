# Brand-Centric Navigation

## Концепция

MediaMoon управлява няколко бранда (Stoitchkov Nutrition, Thegreenbear, Sapphire). Навигацията е **brand-first**: първо избираш бранд, после виждаш модулите за този бранд.

URL pattern: `/brands/[brandId]/[moduleId]`

Старите `/modules/...` routes продължават да работят (за стари bookmarks), но не са surface-нати в sidebar-а.

---

## Структура

```
src/
├── config/
│   └── brands.ts                         ← BRAND_REGISTRY (hardcoded, Phase 1)
│
├── types/index.ts                        ← BrandConfig interface
│
├── app/
│   ├── page.tsx                          → redirect('/brands')
│   │
│   └── brands/
│       ├── page.tsx                      ← Overview (brand cards grid)
│       └── [brandId]/
│           ├── page.tsx                  → redirect to first accessible module
│           └── [moduleId]/
│               └── page.tsx              ← module dispatcher (switch case)
│
├── Section/
│   └── brands/
│       └── BrandsOverview.tsx            ← MUI Grid + brand cards
│
└── components/layout/Sidebar/
    ├── Sidebar.tsx                       ← вече рендира BrandSelector вместо ModuleLinks
    └── BrandSelector/
        ├── BrandSelector.tsx             ← dropdown (Overview + brands), URL-synced
        └── BrandModuleLinks.tsx          ← brand-scoped module nav (под dropdown-а)
```

---

## Routes

| Route | Type | Описание |
|---|---|---|
| `/` | redirect | → `/brands` |
| `/brands` | page | Overview с brand cards |
| `/brands/[brandId]` | redirect | → `/brands/[brandId]/[firstAccessibleModule]` |
| `/brands/[brandId]/[moduleId]` | page | Зарежда dashboard-а за модула, role-gated |

---

## Brands

Брандовете, маркетите им, ad акаунтите и интеграциите са в базата (таблици `Brand`, `Market`, `AdAccount`, `Connection`; ADR 0002). Кодът ги чете само през `src/lib/tenancy` (`listBrands()`, `getBrandContext()`), никога директно.

`BrandConfig` shape (каквото слоят връща за бранд):
```typescript
interface BrandConfig {
  readonly id: string           // URL-safe slug
  readonly label: string        // display name
  readonly emoji: string        // logo fallback
  readonly color: string        // accent (cards, dropdown)
  readonly description: string  // shown in card
  readonly markets: readonly MarketCode[]  // e.g. ['BG', 'ES']; names come from the Market rows
}
```

**Достъп до брандове:** днес Clerk роля може да е ограничена до определени брандове (`src/config/brandAccess.ts`, виж `docs/ProjectRoles.md`); останалите проверки са на ниво модул (`ModuleConfig.roles`). Phase B мести достъпа в базата.

---

## Adding a New Brand

Нов бранд е нов ред в базата (`Brand` + неговите `Market`, `Connection` и `AdAccount` редове). Кодът не се пипа: sidebar-ът, overview-то и routing-ът го показват сами. До екрана за брандове (D1) се добавя от нас; после го прави owner-ът на workspace-а от Settings.

---

## Adding a New Module (важно — две места!)

```
1. src/config/modules.ts                              ← добави entry в MODULE_REGISTRY
2. src/app/brands/[brandId]/[moduleId]/page.tsx       ← добави case в renderModule switch
3. src/app/modules/<id>/page.tsx                      ← (по желание) ако искаш стар URL също да работи
4. Clerk dashboard                                    ← създай role ако модулът е restricted
```

Точка 2 е лесна за пропускане — dispatch switch-ът е там за да държи dashboard import-овете static (без dynamic import-и).

---

## Sidebar Behaviour

`BrandSelector` чете активния бранд от URL чрез `usePathname()` + regex `/^\/brands\/([^/]+)/`.

- Ако URL е `/brands` → dropdown показва "Overview", няма module links отдолу
- Ако URL е `/brands/[brandId]/...` → dropdown показва бранда, отдолу се показват module links scope-нати към този бранд (`/brands/[brandId]/[moduleId]`)
- Browser back/forward → dropdown се синхронизира автоматично (useEffect на `activeBrandId`)
- Смяна на бранд от dropdown-а → `router.push` към първия accessible модул за този бранд

---

## Middleware

`src/middleware.ts` пази `/brands/[brandId]/[moduleId]` routes по същия начин както старите `/modules/[moduleId]`:
- Извлича `moduleId` от URL-а
- Проверява `isRoleAllowed(claims, moduleId)` срещу `MODULE_REGISTRY`
- Ако няма достъп → redirect към `/unauthorized`

`isRoleAllowed` се reuse-ва без промени.

---

## Phase 2 (бъдещо)

- "Add Brand" UI — конфигурируеми брандове вместо hardcoded
- Brand-specific module access (някои брандове да нямат Meta Ads например)
- Per-brand данни и storage (вероятно когато дойдат Prisma + Postgres)
- Brand logos (image вместо emoji)
