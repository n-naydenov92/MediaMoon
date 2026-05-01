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

## Brand Registry

```typescript
// src/config/brands.ts
export const BRAND_REGISTRY: readonly BrandConfig[] = [
  { id: 'stoitchkov',   label: 'Stoitchkov Nutrition', emoji: '💪', color: '#FF6B35', description: '...' },
  { id: 'thegreenbear', label: 'Thegreenbear',         emoji: '🐻', color: '#10B981', description: '...' },
  { id: 'sapphire',     label: 'Sapphire',             emoji: '💎', color: '#1877F2', description: '...' },
]
```

`BrandConfig` shape:
```typescript
interface BrandConfig {
  readonly id: string           // URL-safe slug
  readonly label: string        // display name
  readonly emoji: string        // logo fallback
  readonly color: string        // accent (cards, dropdown)
  readonly description: string  // shown in card
}
```

**Брандовете НЯМАТ role gating** — всеки автентикиран user вижда всички брандове. Role-проверката е на ниво модул (`ModuleConfig.roles`).

---

## Adding a New Brand

```
src/config/brands.ts                ← добави entry в BRAND_REGISTRY
```

Това е всичко. Sidebar-ът, overview-то, routing-ът — нищо друго не се пипа.

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
