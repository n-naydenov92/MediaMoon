# Meta Ads — OAuth Migration Log

## Текущ стейт (2026-04-28)

OAuth логиката е **премахната**. Приложението работи с прост `META_ACCESS_TOKEN` env var.

### Защо

Meta блокира създаването на Ad Creatives от приложения в **Development mode** — грешка `error_subcode: 1885183`. Това важи за **всеки** токен генериран чрез MediaMoon App, независимо дали е System User токен или личен OAuth токен. Заобикалянето не е възможно без приложението да е Published.

### Блокер

Бизнес верификацията на **Stoitchkov Nutrition 2.0** (ID: 836314498214310) е в процес. До нейното одобрение:
- Четене (accounts, campaigns, adsets, pages) ✅ работи
- Писане (create ad creative, create ad) ❌ блокирано от Meta

---

## Какво е имплементирано днес

### Работещо

| Функционалност | Файлове |
|---|---|
| Ad Accounts таблица | `MetaAdsDashboard.tsx` |
| Кликване на акаунт → форма | `MetaAdsDashboard.tsx` |
| Facebook Page dropdown | `PageSelect.tsx`, `pages/route.ts`, `fetchPages()` |
| Campaign dropdown (cascading) | `CampaignSelect.tsx`, `campaigns/route.ts` |
| AdSet dropdown (cascading) | `AdSetSelect.tsx`, `adsets/route.ts` |
| Ad форма (headline, body, URL, CTA, attachment) | `AdCreationForm.tsx`, `AttachmentUpload.tsx` |
| Publish pipeline (upload → creative → ad) | `publish/route.ts`, gateway |
| Publish result (success / error + debug step) | `PublishResult.tsx` |

### Блокирано от Meta

| Функционалност | Причина |
|---|---|
| Publish (create ad creative) | App в Development mode — изисква Published app |

---

## Какво трябва да се направи след верификацията

1. **Публикувай MediaMoon App** в Meta Developer Console → Publish
2. **Подай за App Review** → Ads Management Standard Access
3. **Генерирай нов System User токен** след публикуването
4. **Замени `META_ACCESS_TOKEN`** в `.env.local` и Vercel env vars
5. **Имплементирай OAuth flow** (кодът е описан по-долу) за multi-BM поддръжка

---

## OAuth имплементация (готова за deploy след верификация)

Кодът е бил написан и тестван, после премахнат докато чакаме верификацията. При нужда се имплементира отново за ~30 мин.

### Нови файлове

| Файл | Роля |
|---|---|
| `src/lib/getMetaToken.ts` | Резолвира токена: Clerk `privateMetadata` → `META_ACCESS_TOKEN` fallback |
| `src/app/api/auth/meta/route.ts` | Стартира OAuth → redirect към Facebook |
| `src/app/api/auth/meta/callback/route.ts` | Получава code → long-lived token → записва в Clerk |
| `src/Section/meta-ads/components/FacebookConnect.tsx` | "Connect with Facebook" бутон |

### Промени по съществуващи файлове

| Файл | Промяна |
|---|---|
| `MetaAdsGateway.ts` | Всички функции приемат `token: string` като параметър |
| `src/app/api/meta-ads/*/route.ts` (5 файла) | Добавяне на `getMetaToken()` преди gateway call |
| `src/app/modules/meta-ads/page.tsx` | `hasMetaToken()` проверка → подава `tokenExists` prop |
| `MetaAdsDashboard.tsx` | Показва `FacebookConnect` ако `tokenExists === false` |
| `middleware.ts` | `/api/auth/meta(.*)` като public route |

### Env vars за OAuth

```
NEXT_PUBLIC_META_APP_ID=1776430916668750
META_APP_SECRET=<от Meta → App settings → Basic>
META_REDIRECT_URI=https://<domain>/api/auth/meta/callback
```

### OAuth flow

```
"Connect with Facebook" бутон
  → GET /api/auth/meta
    → redirect към facebook.com/dialog/oauth?scope=ads_management,ads_read,...
      → User approve-ва
        → Facebook → /api/auth/meta/callback?code=xxx
          → code → short-lived token → long-lived token (60 дни)
            → saveMetaToken() → Clerk user.privateMetadata.metaAccessToken
              → redirect към /modules/meta-ads?meta_connected=1
```

---

## Текущи env vars (.env.local)

```
META_ACCESS_TOKEN=<активен токен>   ← единственото нужно нещо сега
```
