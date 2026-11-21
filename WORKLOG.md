# Hisaab worklog

Each line records a proven slice. Commands were run in `C:\Prince\FWAI\hisaab`.

## Baseline

- Cloned the public repo `https://github.com/kbprincesdl/hisaab` -> `git clone` -> cloned successfully into `C:\Prince\FWAI\hisaab`.
- Installed existing dependencies and verified the untouched build -> `npm run lint; npm run build` -> `tsc --noEmit` clean; Vite built `index-DiN927u-.js 292.91 kB │ gzip 90.77 kB`.
- Confirmed the Supabase auth service is reachable with the publishable key -> `GET /auth/v1/settings` -> `200 {"external":{"email":true,"phone":false,...},"disable_signup":false,"mailer_autoconfirm":false}`.
- Confirmed the cloud tables do not exist yet -> `GET /rest/v1/shops?select=* limit 1` -> `404 {"code":"PGRST205","message":"Could not find the table 'public.shops' in the schema cache"}`; `GET /rest/v1/` -> `401 {"message":"Secret API key required"}`.

## Storage and data safety

- Replaced the single `localStorage` document with IndexedDB plus a one-time legacy import -> `npm run lint` -> clean.
- Added a JSON backup slot (five most recent) and a strict all-or-nothing importer -> `npm test` -> `20 passed (20)`.
- Browser check: blank customer and bad phone are rejected; a valid customer is added -> Playwright -> `BLANK CUSTOMER: true`, `BAD PHONE: true`, `CUSTOMER ADDED: true`.
- Browser check: an invalid import is rejected and the existing ledger is untouched -> Playwright -> `{"showsError":true,"hasCustomerAfter":true}`.
- Browser check: the ledger survives a full page reload -> Playwright -> `{"hasRavi":true,"hasShop":true,"hasAuth":false,"total":"₹11,820","mode":"local"}`.

## Overdue and money logic

- Added FIFO payment allocation, per-credit due dates and aging buckets -> `npm test` -> `20 passed (20)`; sample ledger now reports `Overdue 3`, `Due soon 5` instead of the old "all balances are overdue".
- Browser check: `Due today` / `Due tomorrow` render correctly -> Playwright body text -> `Kavitha S ... Due today`, `Fatima Begum ... Due tomorrow`.
- Browser check: quick collect prefills the full balance and updates the total -> Playwright -> `{"before":"₹11,820","amount":"670","after":"₹11,150","toast":true}`.

## Cloud foundation

- Added Supabase auth/session handling and a local-first, versioned snapshot sync, plus `supabase/migrations/0001_init.sql` -> `npm run lint` -> clean.
- Replaced the raw `PGRST205` error with a **Cloud setup required** card that copies `/setup.sql`, links to the project SQL editor, and makes **Sync now** retry shop creation -> `npm test` -> `Test Files 2 passed (2)`, `Tests 22 passed (22)`; `npm run build` -> `600.43 kB │ gzip 167.04 kB`.
- Removed the unused root `esbuild@^0.25` and `fake-indexeddb`, deleted the stale `bun.lock`, and regenerated `package-lock.json` -> `npm install` (no legacy flag) -> `removed 3 packages, changed 2 packages`, `found 0 vulnerabilities`; `npm run lint` clean, `npm test` 24 passed, `npm run build` 600.57 kB.
- Committed and pushed the work -> `git commit -c user.name=...` -> `[main d039a40] feat: add local-first ledger, cloud backup and redesigned UI`, `46 files changed, 11294 insertions(+), 1621 deletions(-)`; `git push origin main` -> `b161f1e..d039a40 main -> main`.
- Vercel auto-deployed after the push -> fetch `https://hisaab-indol.vercel.app/` -> `200`, new welcome screen, no console errors; live CSS `index-BD3wcTni.css` matches the build; live body also reports `Cloud backup is not configured for this build` because Vercel has no Supabase env vars; `/setup.sql` -> `200`, 5664 chars.
- Made the build accept Vercel/Next env names -> temporarily replaced `.env.local` with only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, ran `npm run build` -> `URL_IN_BUNDLE: True`, `KEY_PREFIX_IN_BUNDLE: True`; restored `.env.local` and rebuilt -> 600.57 kB; `npm run lint` clean, `npm test` 24 passed.
- Pushed the env alias and rechecked live -> `git push` -> `a12bd77..fdb8b90 main -> main`; live Playwright after 40s -> `cloudNotConfigured: true`, so the Vercel Production env vars are still absent; the app itself has no console errors and the new UI is live.
- Renamed the shop to `Lakshmi Provision Store` everywhere in the sample/defaults, cloud fallback, SQL default/trigger and screenshots; added a legacy migration that strips `(fictional)` and maps old `My Kirana Store`/`Hisaab Store` defaults -> `npm test` -> `Tests 24 passed (24)`; browser body -> `Lakshmi Provision Store` with no suffix; `npm run build` -> 600.57 kB | gzip 167.10 kB.
- Rechecked the live site after the name/env deploys -> Playwright -> `cloudNotConfigured: false`, `hasOldName: false`, `hasNewName: true`, `ERRORS: []`; `GET /rest/v1/shops` still `404 PGRST205` because the SQL migration has not been run.
- Cloud end-to-end verification is blocked until the SQL migration is run in the Supabase project; see `REPORT.md`. The setup card itself is unit-tested for `PGRST205` detection but was not visually exercised inside the user's signed-in browser session.

## Redesign

- Replaced the pale stone UI with deep green, saffron and cream; Bricolage Grotesque + DM Sans; full-width outstanding band; compact rows; sheets; bottom navigation; reports; settings -> `npm run build` -> `dist/assets/index-DRuZpqVw.js 597.14 kB │ gzip 165.77 kB`; OCR split to `src-TAbbrvBY.js 17.24 kB │ gzip 7.29 kB`.
- Browser check at 1440 px -> Playwright -> `scrollWidth 1440`, `innerWidth 1440`, `smallTargets []`, `ERRORS: []`.
- Browser check at 375 px -> Playwright -> `scrollWidth 375`, `innerWidth 375`, `smallTargets []`, `ERRORS: []`.
- Browser check on mobile auth first screen -> Playwright -> `emailTop 462.7`, `viewport 812`, `emailVisible true`, `scrollWidth 375`.
- Reminder click opens WhatsApp with the customer and balance -> Playwright -> `https://api.whatsapp.com/send/?phone=919000000104&text=Namaste+Anjali+Reddy...`.
- Reminder is logged locally -> Playwright -> `REMINDER LOGGED: true`.
- Settings sheet touch targets -> Playwright -> `SETTINGS SMALL TARGETS: []`.

## Contrast (WCAG formula, run in Node)

- `#FBF6EA` on `#0B3D2E` -> 11.31
- `#FBF6EA` at 65% on `#0B3D2E` -> 5.70
- `#14231D` on `#FBF6EA` -> 15.12
- `#5C6B63` on `#FBF6EA` -> 5.21
- `#5C6B63` on `#FFFFFF` -> 5.62
- `#B42318` on `#FFFFFF` -> 6.57
- `#B42318` on `#FDE8E4` -> 5.58
- `#9A5B00` on `#FFF1D6` -> 4.86
- `#9A5B00` on `#FFFFFF` -> 5.43
- `#0F7A55` on `#DFF3EA` -> 4.61
- `#0F7A55` on `#FFFFFF` -> 5.34
- `#A34A00` on `#FFFFFF` -> 5.94
- `#A34A00` on `#FBF6EA` -> 5.51
- `#A34A00` on `#FBE3CC` -> 4.80
- `#14231D` on `#E8751A` -> 5.43
- `#F2B544` on `#0B3D2E` -> 6.66
- `#FBF6EA` on `#B42318` -> 6.10

## Fixes discovered while proving the slices

- Mobile header overflowed to 484 px because the shop name, sync pill, language, gear and add button all sat in one row -> hid the shop name and gear on phone, moved settings to bottom nav -> `scrollWidth 375`.
- The 40 px nav/language/tab controls and 36 px restore/full-balance buttons failed the 44 px target -> raised them -> `smallTargets []`.
- Saffron text on cream measured 2.79:1 -> added `--color-saffron-ink: #a34a00` (5.51:1 on cream, 5.94:1 on white) for text and icons, keeping `#E8751A` for fills with ink text.
- A bulk PowerShell rewrite double-encoded `₹` and Hindi text in `ledger.ts` -> repaired with a Node UTF-8 read/write; a scan for `Â`, `Ã`, `à¤`, `â‚¹` now returns no files.
- The first mobile auth screen pushed the email field below the fold -> hid the repeated subtitle/feature list on phone -> `emailTop 462.7 < 812`.
- The old “Overdue” tab was only `balance > 0` -> replaced with FIFO aging and a real overdue amount -> sample now shows `Overdue 3`.
