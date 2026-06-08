# Facebook Multi-Creative Ads — изследване и решение

> Статус: **PARKED (nice-to-have)** — кодът по тази функционалност е ревъртнат на 2026-06-08.
> Причина: единственият начин да се валидира е реклама **LIVE**, а в момента не пускаме live.
> Този файл пази всичко научено, за да не повтаряме изследването.

---

## 1. Целта

Една реклама да носи **pool от няколко криейтива** (до 10 снимки/видеа), от които Meta
сама избира кой да покаже на всеки потребител. В UI на Ads Manager това е секцията
**„Ad creative → Media → Uploaded media — N of 10 selected"** (новият „up to 10 media"
формат, заместил стария „Dynamic creative", който вече е депрекейтнат).

Това **не е** карусел и **не е** настройка на ниво ad set.

---

## 2. Двата формата, които открихме

Едно и също действие в UI произвежда **различни** креатив структури според акаунта
(rollout per ad account), при иначе **еднакъв** обектив (`OUTCOME_SALES` /
`OFFSITE_CONVERSIONS` / `WEBSITE`):

### A) Стар формат — `asset_feed_spec` (Sapphire)
Всички медии се пазят като хешове, **видими в API-то** (по документацията на Meta).

```jsonc
object_story_spec: { "page_id": "...", "instagram_user_id": "..." }
asset_feed_spec: {
  "images": [ {"hash": "..."}, {"hash": "..."}, ... ],   // 1..10, всички видими
  "bodies": [ {"text": "..."} ],
  "titles": [ {"text": "..."} ],
  "descriptions": [ {"text": ""} ],
  "link_urls": [ {"website_url": "..."} ],
  "call_to_action_types": ["LEARN_MORE"],
  "ad_formats": ["AUTOMATIC_FORMAT"],
  "optimization_type": "PLACEMENT"   // или REGULAR (виж §4)
}
```

### B) Нов формат — `link_data` + `contextual_multi_ads` (TheGreenBear)
Само **една primary** снимка е видима в creative-а. Допълнителните pool-медии
**НЕ са в публичното API** — нито в creative, нито в поста.

```jsonc
object_story_spec: {
  "page_id": "...", "instagram_user_id": "...",
  "link_data": {
    "link": "...", "message": "...", "name": "...",
    "image_hash": "...",                 // САМО 1 hash
    "call_to_action": { "type": "..." }
  }
}
contextual_multi_ads: { "enroll_status": "OPT_IN" }
// asset_feed_spec тук съдържа само call_ads_configuration (ако има телефон/CTA SEE_MENU)
```

---

## 3. Ключови находки (доказани на живо в акаунтите)

1. **Кодът на приложението праща `asset_feed_spec` — това е коректният, документиран начин.**
   Хешовете се пазят, тъмбнейл се показва, адът е **доставим** (`PENDING_REVIEW`,
   нула `issues_info`, API preview се рендерира).

2. **Реален ръчен ад на Sapphire („zar") използва същия `asset_feed_spec` формат** с 3 хеша —
   тоест приложението съвпада с легитимен ръчно направен ад.

3. **Новият редактор (TheGreenBear) не рендерира `asset_feed_spec` формата** → показва
   „Media" празно и „0 media being used in this ad", въпреки че данните и доставката са наред.
   Това е ограничение на **показването в новия UI**, не дефект в данните.

4. **`contextual_multi_ads` = „Multi-advertiser ads"** (рекламата се показва до други
   рекламодатели). **НЕ е** флагът за „up to 10 media" pool. (Първоначална грешна следа.)

5. **Pool-ът на новия формат не е достъпен през публичното API.** Три ръчни ада поред
   (1× Sapphire, 2× TheGreenBear) върнаха **точно 1 image_hash**. Подлежащият пост,
   прочетен с **page token**, е единичен `share` без `subattachments` — т.е. допълнителните
   медии са във вътрешна Meta структура, невидима за Graph API.

6. **`/{ad}/copies` е блокиран на ниво приложение** (`#3 Application does not have the
   capability`) — и на двата акаунта. Зависи от capability на Meta App-а (Advanced Access
   за Ads Management), не от акаунта. Затова нативен дубликат не е възможен с тези токени.

7. **Четенето на поста** изисква `pages_read_engagement`; ads-токените го нямат
   (но page token се извлича при акаунт с пълни права — TheGreenBear).

---

## 4. `optimization_type` — само за справка (НЕ е причината за проблема)

- `PLACEMENT` → събира се в адсет с **други ади**; легитимен за multi-media.
- `REGULAR` (или липсващ → default REGULAR) → класически Dynamic Creative; Meta връща
  **„Cannot have more than one ad in given Dynamic Creative Ad Set"** (макс 1 ад/адсет).
  Dynamic Creative адсетът е депрекейтнат.
- `REGULAR` + `USER_ENROLLED_AUTOFLOW` → винаги отказва: *„Asset Feed Optimization Type
  And DoF Spec Mismatch"*.
- `standard_enhancements` в `degrees_of_freedom_spec` е **deprecated за запис** — Meta го
  добавя сама при четене, но отказва, ако го пратиш.

---

## 5. Изводи

- **Сетъпът на приложението (asset_feed_spec) е верен и доставим.** Множеството медии се
  пазят и са видими в API-то на акаунти, които ползват стария формат.
- **„Празната медия" в новия редактор е проблем на показването в UI на Meta**, не в данните.
- **Новият „up to 10 media" формат (link_data + вътрешен pool) не е възпроизводим 1:1 през
  документираното API** — допълнителните медии живеят извън четимия creative/пост.
- **Единственото недоказано нещо:** дали при пускане **LIVE** `asset_feed_spec` адът реално
  ротира/сервира всичките N различни медии като pool. Без live тест не е потвърдено.

## 6. Решение

Функционалността се **паркира като nice-to-have**. Кодът по нея се ревъртва, за да не
блокира по-важни функционалности. Когато се отвори възможност за **live тест**, се връщаме
тук и валидираме доставката на pool-а.

---

## 7. Тестови реклами, създадени по време на изследването (всички PAUSED)

> Оставени са PAUSED за справка; може да се изтрият ръчно от Ads Manager.

### Sapphire — `act_734480455547742`, ad set `120245985120840207`
- `120246464907210207` — REPLICA zar 1to1 (asset_feed_spec + DOF)
- `120246465249180207` — PLAIN replica (asset_feed_spec, без DOF)
- `120246465733910207` — TESTTTT pool 4img (asset_feed_spec, 4 хеша, body/headline ТЕСТТТТ)
- `120246467556670207` — LINKDATA replica на Manual-setup (link_data, 1 снимка)
- Orphan creatives (без ад): `992298603662877`, `1388268636465810`, `4355631714679299`

### TheGreenBear — `act_222478775571065`, ad set `120247391320150542`
- `120247458140880542` — CLONE Manual-setup 1to1 (link_data + contextual_multi_ads)
- `120247459155950542` — AFS PLACEMENT 4imgs + CMA (asset_feed_spec 4 хеша + contextual_multi_ads)
- `120247460289790542` — POST-from-GET на Manual-setup (link_data, 1 снимка)
- Orphan creative (без ад): `1312578783752151`
- Ръчни (от потребителя): `120247457486050542` „Manual setup", `120247460394470542` „Manual setup-Two"

### Реален доставял ад за справка (placement customization, НЕ pool)
- Sapphire `IMG-Gluco1…` — 69 675 импресии, $591.90; `asset_feed_spec` с `optimization_type:
  PLACEMENT` + `asset_customization_rules` (същият hash, различни `image_crops` per placement).
