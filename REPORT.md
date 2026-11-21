# Hisaab v2 report

Project: `C:\Prince\FWAI\hisaab` (public repo `kbprincesdl/hisaab`).
Built on 2026-11-21. Local app: `http://localhost:3000`.

## Post-deploy update (2026-11-21)

- The Supabase `shops` and `ledger_snapshots` tables now exist. An anon query returns `401 permission denied`, which is expected under RLS; `customers`/`entries` 404s are expected because this app stores one JSON snapshot, not those relational tables.
- Magic links still return to localhost until Supabase **Authentication → URL Configuration → Site URL** is set to `https://hisaab-indol.vercel.app` and the live + localhost URLs are added to **Redirect URLs**. The app now sends `VITE_AUTH_REDIRECT_URL`.
- The signed-in local session shows a sync conflict; the app now displays the actual cloud error in Settings. Re-run the updated SQL and retry **Sync now**.

## Status per part

### Local-first storage: DONE

The original single `localStorage` document was replaced with IndexedDB, including a one-time migration from `hisaab_ledger_v1`. Storage errors are returned to the UI instead of being swallowed, and a five-slot local backup store was added.

Evidence:

- `npm run lint` -> clean (`tsc --noEmit`, no output).
- Browser reload after importing the sample -> `{"hasRavi":true,"hasShop":true,"hasAuth":false,"total":"₹11,820","mode":"local"}`.

### Real overdue aging: DONE

Payments are allocated FIFO to the oldest credits. Every credit lot gets a due date from the shop's credit period. The Overdue tab only includes customers with money past due, and due-today / due-tomorrow labels are explicit.

Evidence:

- `npm test` -> `Test Files 2 passed (2)`, `Tests 24 passed (24)`.
- Sample ledger after the change -> `Overdue 3`, `Due soon 5`, `Overdue ₹2,520`, `Due in 7 days ₹4,770`; before the change the old app showed all 8 customers as Overdue.

### Strict import and backup: DONE

Import is now all-or-nothing. Duplicate phones, unknown entry phones, bad amounts, bad dates, oversized receipts and bad credit periods are rejected with row-level messages. A backup of the current ledger is written before replacement, and the UI requires a review checkbox before the destructive button enables.

Evidence:

- `npm test` -> 24 tests pass, including partial-import rejection, duplicate phone, bad amount/date, backup-envelope import and invalid credit period.
- Browser invalid import -> `{"showsError":true,"hasCustomerAfter":true}` (the existing customer was not lost).
- Settings after loading the sample shows a local `before-import` backup with a Restore action.

### Redesigned UI and mobile layout: DONE

Deep green, saffron and cream brand; Bricolage Grotesque + DM Sans; full-width outstanding band; compact ledger rows; quick collect sheet; customer detail; reports; settings; auth welcome; mobile bottom navigation; 44 px targets; measured contrast.

Evidence:

- Desktop 1440 px -> `scrollWidth 1440`, `smallTargets []`, `ERRORS: []`.
- Phone 375 px -> `scrollWidth 375`, `smallTargets []`, `ERRORS: []`.
- Mobile auth first screen -> `emailTop 462.7`, `viewport 812`, `emailVisible true`.
- Contrast measurements are in `WORKLOG.md`; the lowest text pair is `#0F7A55` on `#DFF3EA` at 4.61:1, and the brand pairs are 5.43:1 or higher.
- Screenshots are in `screenshots/`: `desktop-ledger.png`, `phone-ledger.png`, `phone-auth.png`, `desktop-detail.png`, `desktop-reports.png`, `desktop-settings.png`, `phone-hindi.png`.

### Quick collection, reminders, reports and Hindi: DONE

- Quick collect prefilled Ravi Kumar's full balance of ₹670 and reduced total outstanding from `₹11,820` to `₹11,150`; the success toast was `Payment recorded`.
- A reminder click opened `https://api.whatsapp.com/send/?phone=919000000104&text=Namaste+Anjali+Reddy...` and the local row then showed `Last reminded just now`.
- Reports show this month's credit/collections, aging buckets, top balances, six-month trend and cash vs UPI. The sample payments carry cash/UPI methods.
- Hindi mode renders the ledger, metrics, tabs, customer rows and settings labels in Hindi. Dates still use English month abbreviations.

### Cloud auth and snapshot sync: BLOCKED (code complete, verification blocked)

Code exists for Supabase email magic-link auth, `shops` / `ledger_snapshots` / `ledger_backups`, RLS, a versioned save function, local-first snapshot sync, merge-on-conflict and server-side backups. The Settings sheet now detects the missing-table error, shows a **Cloud setup required** card that copies the setup SQL and links to the project SQL editor, and **Sync now** retries shop creation after the SQL is run. The setup-error detector is unit-tested. End-to-end cloud sync is still unverified because the tables do not exist yet.

```
BLOCKED: Supabase tables were never created
  Tried:      GET https://gtkzzlmmiajebpoyweoa.supabase.co/rest/v1/shops?select=*&limit=1 with the publishable key
  Got:        404 {"code":"PGRST205","details":null,"hint":null,"message":"Could not find the table 'public.shops' in the schema cache"}
  Wall:       a publishable key cannot run DDL; no service-role key or database password was provided, and secrets must not be pasted into chat.
  To unblock: run supabase/migrations/0001_init.sql in the Supabase SQL editor, add the redirect URLs, then sign in and load the sample.
```

Supporting facts:

- `GET /auth/v1/settings` -> `200` with `"email":true`, `"phone":false`, `"disable_signup":false`.
- `GET /rest/v1/` -> `401 {"message":"Secret API key required","hint":"Only secret API keys can be used for this endpoint."}`.
- The migration is at `supabase/migrations/0001_init.sql`.

### GitHub commit and Vercel deployment: DONE

Commits `d039a40` (app), `a12bd77` (docs), `fdb8b90` (Vercel/Next env alias), `c122a8d` (docs) and `5d4edb8` (shop name) are on `main` and pushed to `https://github.com/kbprincesdl/hisaab`. Vercel auto-deployed; `https://hisaab-indol.vercel.app/` returned `200` and rendered the new welcome screen with no console errors. The live CSS asset is `index-BD3wcTni.css`, matching the local build.

The live build now reads the Supabase environment variables: the “Cloud backup is not configured” warning is gone, and a live sample import shows **Lakshmi Provision Store** with no `(fictional)` suffix.

One cloud configuration gap remains:

- The Supabase tables are still missing (`GET /rest/v1/shops` -> `404 PGRST205`). The migration has not been run yet. After sign-in, the Settings sheet shows the **Cloud setup required** card.

## What broke and how I fixed it

1. **The old ledger could disappear silently.** Writes to `localStorage` were wrapped in `try {} catch {}`; when the 5 MB quota filled, the UI still showed the entry as saved. Moved the ledger to IndexedDB and made save failures visible.
2. **“Overdue” was just “balance > 0”.** Replaced it with FIFO payment allocation and per-credit due dates; the sample now shows 3 overdue customers, not 8.
3. **Import could partially replace a ledger.** The old parser skipped bad rows and auto-created customers for unknown phones. The new parser is strict and all-or-nothing, with a preview and a backup first.
4. **The mobile header overflowed the viewport to 484 px.** The shop name, sync pill, language, gear and add button did not fit; hid the shop name and gear on phone and moved Settings to the bottom navigation.
5. **Saffron text on cream measured 2.79:1.** Added `--color-saffron-ink: #a34a00` for text and icons (5.51:1 on cream, 5.94:1 on white) and kept `#E8751A` for fills with ink text.
6. **Several controls were under 44 px.** Raised nav, language, tab, restore and full-balance controls; the final browser audit reports `smallTargets []`.
7. **The mobile auth form started below the fold.** Hid the repeated subtitle and feature list on phone; the email field now sits at 462 px in an 812 px viewport.
8. **“Due in 0d” looked broken.** Added explicit `Due today` and `Due tomorrow` labels in English and Hindi.
9. **A bulk PowerShell rewrite double-encoded `₹` and Hindi text in `ledger.ts`.** Repaired the file with a Node UTF-8 read/write and verified with a scan for `Â`, `Ã`, `à¤`, `â‚¹` (no matches).
10. **The old row repeated “23d overdue” three times on mobile.** Removed the duplicate mobile status; the balance status and overdue label now appear once.
11. **The first signed-in cloud attempt showed a raw `PGRST205` string.** That was the real cause: the Supabase tables had never been created. Replaced it with a setup card, exposed `/setup.sql` for one-click copying, linked the SQL editor, and made Sync now retry `ensureShop` instead of silently doing nothing when `shopId` was null.
12. **Vercel used `NEXT_PUBLIC_*` env names, which Vite ignores by default.** Added `envPrefix: ['VITE_', 'NEXT_PUBLIC_']` and fallbacks for `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. A production build made with only the `NEXT_PUBLIC_*` variables contains the Supabase URL and publishable key, so the Vercel configuration now works without renaming.
13. **The shop name still carried `(fictional)` and the old default.** Changed `DEFAULT_SHOP_NAME`, the sample shop, the cloud fallback, the SQL column default and the new-user trigger to **Lakshmi Provision Store**. Added `normalizeShopName` so existing IndexedDB/cloud data and old imports are upgraded on load, and refreshed the screenshots.

## Claims ledger

| Claim | Proof | Status |
| --- | --- | --- |
| TypeScript is clean | `npm run lint` -> no output | Proven |
| 24 tests pass | `npm test` -> `Tests 24 passed (24)` | Proven |
| Shop name is Lakshmi Provision Store | Browser body -> `Lakshmi Provision Store`; tests cover old-name migration | Proven |
| Production build succeeds | `npm run build` -> `index-V6Zk6eQK.js 600.76 kB │ gzip 167.12 kB`; OCR chunk 17.24 kB | Proven |
| Ledger survives reload | Playwright -> `hasRavi true`, `total ₹11,820`, `mode local` | Proven |
| Real overdue aging | Sample -> `Overdue 3`, `Due soon 5`; tests cover FIFO, due soon, advance | Proven |
| Invalid import is rejected without data loss | Playwright -> `showsError true`, `hasCustomerAfter true` | Proven |
| Quick collect saves and updates total | Playwright -> `before ₹11,820`, `amount 670`, `after ₹11,150`, `toast true` | Proven |
| Reminder opens WhatsApp and logs | Playwright -> `api.whatsapp.com/send/?phone=919000000104...`; `REMINDER LOGGED true` | Proven |
| 375 px has no sideways scroll | Playwright -> `scrollWidth 375`, `innerWidth 375` | Proven |
| 1440 px has no sideways scroll | Playwright -> `scrollWidth 1440`, `innerWidth 1440` | Proven |
| Touch targets are 44 px or taller | Playwright -> `smallTargets []` on ledger and settings | Proven |
| Contrast passes AA for measured pairs | Node WCAG calculation; list in `WORKLOG.md` | Proven for listed pairs |
| Supabase auth service is reachable | `GET /auth/v1/settings` -> 200, email true | Proven |
| Supabase tables exist | anon query -> `401 permission denied`; the table exists under RLS | Proven |
| Missing-table errors are detected | `cloud.test.ts` -> `isCloudSetupError('PGRST205')` true | Proven |
| Email magic link works end-to-end | Not sent; no inbox, no redirect URL configured | **UNVERIFIED** |
| Cloud snapshot save/merge works end-to-end | Code compiles; tables missing; no sign-in test | **UNVERIFIED** |
| Payment screenshot OCR works | Code path preserved and dynamically imported; no image upload in this run | **UNVERIFIED** |
| WhatsApp reminder is delivered | Click-to-chat opens the WhatsApp URL; delivery cannot be confirmed | **UNVERIFIED delivery** |
| GitHub commit and push | `git log` -> `d039a40 feat: add local-first ledger, cloud backup and redesigned UI`; `git push` -> `b161f1e..d039a40 main -> main` | Proven |
| Live Vercel site is updated | Live fetch -> `200`; Playwright -> new welcome screen, no console errors; live CSS `index-BD3wcTni.css` matches the build | Proven |
| Live auth redirect configured | Code sends `VITE_AUTH_REDIRECT_URL`; Supabase Site URL still needs to be changed in the dashboard | **Not done** |
| Live shop name is Lakshmi Provision Store | Live Playwright -> `hasOldName false`, `hasNewName true`, body starts `Hisaab / Lakshmi Provision Store` | Proven |
| Vercel cloud env is configured | Live Playwright -> `cloudNotConfigured: false` | Proven |

## What I would tell the next person

1. Run `supabase/migrations/0001_init.sql` in the Supabase SQL editor, then add `https://hisaab-indol.vercel.app` and `http://localhost:3000` to Authentication → URL Configuration. The in-app **Cloud setup required** card can copy the SQL and open the editor; after running it, press **Sync now**. Without those steps, cloud sync cannot work.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel, then deploy. Never put a service-role key or database password in a `VITE_` variable.
3. The phone's IndexedDB is the source of truth. Cloud sync is local-first and must not block recording a payment; test a payment while offline, then reconnect.
4. The build warns about a 597 kB chunk. The next performance step is splitting Supabase, Reports, Settings and the customer detail into lazy chunks. OCR is already split (17.24 kB).
5. Receipt images are compressed data URLs inside the snapshot. The app caps one receipt at 2.5 MB and all import receipts at 8 MB. At real shop scale, move them to Supabase Storage and store paths in entries.
6. WhatsApp reminders are click-to-chat. The app records that the reminder was opened, not that it was delivered or read.
7. The sample shop dates are generated relative to today, so the demo stays current. Do not use the sample as real shop data.
8. Commits through `5d4edb8` are live. The Vercel environment variables are now read and the live warning is gone. The remaining step is the Supabase SQL migration: run `supabase/migrations/0001_init.sql`, then press **Sync now**; after sign-in the Settings sheet exposes **Copy setup SQL** and **Open Supabase SQL editor**. Vite inlines env values at build time, so if the vars are ever changed, redeploy. The repo is now npm/`package-lock.json` based; the stale `bun.lock` was removed so Vercel installs the new dependencies.
9. Use a Node UTF-8 read/write for bulk file edits on this machine. A PowerShell `Get-Content | Set-Content` pass corrupted `₹` and Hindi text once.
