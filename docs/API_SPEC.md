# API Spec

The REST + WebSocket surface the three frontends (`apps/trader`, `apps/admin`, `apps/superadmin`) call, derived from the 56 pages in `docs/roles/*.md` and the tables in `DATABASE_SCHEMA.md`. This doc lists routes and what they do, not full request/response schemas — those fall out of `DATABASE_SCHEMA.md` directly and aren't duplicated here. Proposed items are marked **(proposed)**.

## Conventions

- **One backend, one base API**, path-prefixed by surface: `/api/trader/...`, `/api/admin/...`, `/api/superadmin/...`. Shared concerns (login, OTP, tenant config) sit under `/api/auth/...` and `/api/tenant/...`.
- **Tenant is never in the URL or body** — it's resolved from the request hostname in middleware (`ARCHITECTURE.md` §2) and from the session. A trader endpoint never takes a `tenant_id` param; it's implicit.
- **Auth:** httpOnly session cookie, not a bearer token (`TECH_STACK.md`). Every request below requires a valid session for that surface unless marked **public**.
- **Errors:** `{ "error": { "code": "...", "message": "..." } }`, standard HTTP status (400 validation, 401 no session, 403 wrong role/permission/tenant, 404, 409 conflict e.g. duplicate subdomain).
- **Money amounts:** decimal strings, not floats (Postgres `numeric`, per the money rule — avoids float rounding on balances).
- **Lists:** paginated (`?page=&pageSize=`), filterable per page where the role doc says so (status, date range, symbol, user).
- **Writes that touch a balance** always respond with the updated balance/transaction row, not just `{ ok: true }` — so the frontend never has to guess the new balance.

## Auth (shared shape, scoped per surface by cookie name)

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/auth/trader/signup` | **public.** Email, password, optional referral code. Sends verification OTP. |
| POST | `/api/auth/trader/verify-email` | **public.** OTP from signup. |
| POST | `/api/auth/trader/login` | **public.** No OTP by default. |
| POST | `/api/auth/admin/login` | **public.** OTP if tenant's `admin_otp_enabled` is on. |
| POST | `/api/auth/superadmin/login` | **public.** OTP always required (two-step: password, then OTP). |
| POST | `/api/auth/{surface}/forgot-password` | **public.** Sends reset OTP. |
| POST | `/api/auth/{surface}/reset-password` | **public.** OTP + new password. |
| POST | `/api/auth/{surface}/logout` | Destroys the session in Redis. |
| GET | `/api/auth/{surface}/me` | Current session's user + role + (if trader) KYC status. |

`{surface}` is `trader`, `admin`, or `superadmin` — three separate cookies, three separate login flows, per `ARCHITECTURE.md` §3. Sub-admin logs in through `/api/auth/admin/login` too; it's a `users` row with `role = sub_admin`, not a separate flow — `GET /me` returns its `permissions` set so the admin frontend knows what to render.

## Tenant / branding

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/tenant/config` | **public.** Resolved from hostname: logo, name, brand colours, enabled symbols. Engineering rule: never hard-code a client's branding. |

## Trader API (`/api/trader/...`) — 16 pages

| Page | Method | Path | Notes |
| --- | --- | --- | --- |
| Trading Terminal | GET | `/api/trader/positions/open` | Live open positions for the account. |
| Trading Terminal | POST | `/api/trader/orders` | Place a market order (symbol, side, lots, SL/TP). 403 if KYC not approved. |
| Trading Terminal | PATCH | `/api/trader/positions/:id` | Modify SL/TP on an open position. |
| Trading Terminal | POST | `/api/trader/positions/:id/close` | Manual close. |
| Markets | GET | `/api/trader/symbols` | Tenant's enabled symbols only, with that trader's group markup applied (never the raw price). |
| Holdings | GET | `/api/trader/positions/open` | Same as above (Holdings page reuses it). |
| History | GET | `/api/trader/positions/history` | Closed trades, filter by date/symbol. |
| Dashboard | GET | `/api/trader/account/summary` | Balance, equity, free margin, margin level, floating PnL (`TRADING_ENGINE.md` §7 formulas). |
| Deposit | GET | `/api/trader/payment-methods` | Tenant's bank/USDT details (from Admin's Payment Methods config). |
| Deposit | POST | `/api/trader/deposits` | Amount + method + proof file id → `deposits` row, status `pending`. |
| Withdraw | POST | `/api/trader/withdrawals` | Amount + method → `withdrawals` row, status `pending`. |
| Requests | GET | `/api/trader/requests` | Combined status feed: deposits, withdrawals, KYC — merged by `created_at`. |
| KYC / Documents | GET | `/api/trader/kyc/form` | Current published `kyc_form_templates` for this tenant. |
| KYC / Documents | POST | `/api/trader/kyc/submissions` | Submit/resubmit KYC + documents. |
| KYC / Documents | POST | `/api/trader/referral-code` | Set referral code once (rejected if already set). |
| Copy Trading | GET | `/api/trader/copy/followable` | Referrer + admin-listed public masters. |
| Copy Trading | POST | `/api/trader/copy/follow` | Start following (`copy_follows` row). |
| Copy Trading | POST | `/api/trader/copy/:id/stop` | Stop following. |
| Refer & Earn | GET | `/api/trader/referrals` | Own referral link/code, referred users, earnings total. |
| Notification Center | GET | `/api/trader/notifications` | List; `read_at` update on open. |
| Settings | GET/PATCH | `/api/trader/profile` | Profile fields, change password. |
| Files | POST | `/api/files` | Shared upload endpoint (§ below) — used by Deposit, KYC. |

## Admin API (`/api/admin/...`) — 23 pages

Every route below is also gated by the sub-admin's `permissions` set (§ Auth), checked in backend middleware, not just hidden in the UI (`ARCHITECTURE.md` §3).

| Page | Method | Path | Notes |
| --- | --- | --- | --- |
| Dashboard | GET | `/api/admin/dashboard` | Totals: deposits, withdrawals, pending counts, users, open positions. |
| Active Orders | GET | `/api/admin/positions/open` | All tenant users' open positions, with balance/equity/margin/PnL. |
| Active Orders | POST | `/api/admin/positions/:id/close` | Admin-forced close. |
| Active Orders | PATCH | `/api/admin/positions/:id` | Admin-side SL/TP modify. |
| Order History | GET | `/api/admin/positions/history` | Filter by user/symbol/date. |
| User List | GET | `/api/admin/users` | Search, filter by KYC status / active-blocked. |
| User Detail | GET | `/api/admin/users/:id` | Full profile, balance, holdings, history, documents, referral info. |
| User Detail | POST | `/api/admin/users/:id/block` | Toggle blocked status. |
| User Detail | POST | `/api/admin/users/:id/reset-password` | Admin-triggered reset email. |
| User Detail | POST | `/api/admin/users/:id/balance-adjustment` | Amount + reason, required. Writes `transactions` row, `type = manual_adjustment`, logged to Activity Log (money rule, no exceptions). |
| KYC Requests | GET | `/api/admin/kyc/submissions` | Pending/all, filter by status. |
| KYC Requests | POST | `/api/admin/kyc/submissions/:id/decision` | Approve/reject + reason. |
| Deposit Requests | GET | `/api/admin/deposits` | Pending/all. |
| Deposit Requests | POST | `/api/admin/deposits/:id/decision` | Approve (writes `transactions` + updates balance, same DB transaction) or reject. |
| Withdrawal Requests | GET | `/api/admin/withdrawals` | Pending/all. |
| Withdrawal Requests | POST | `/api/admin/withdrawals/:id/decision` | Approve/reject. |
| Withdrawal Requests | POST | `/api/admin/withdrawals/:id/mark-paid` | After approval, marks paid. |
| Transactions Report | GET | `/api/admin/transactions` | Filterable, exportable (CSV). |
| Payment Methods | GET/PUT | `/api/admin/payment-methods` | Bank + USDT BEP20/TRC20 addresses shown to traders. |
| Symbol Settings | GET | `/api/admin/symbols` | Master list + this tenant's enabled/leverage/lot/hours. |
| Symbol Settings | PUT | `/api/admin/symbols/:symbolId` | Enable/disable, leverage cap, min/max lot, trading hours. |
| Groups & Markups | GET/POST | `/api/admin/groups` | Create/list groups. |
| Groups & Markups | PUT | `/api/admin/groups/:id/markups` | Per-symbol or blanket markup for the group. |
| Bonus | GET/PUT | `/api/admin/bonus/rules` | Bonus rules config. |
| Bonus | POST | `/api/admin/users/:id/bonus` | Manual bonus grant → `bonuses` row + `transactions` row. |
| Copy Trading | PUT | `/api/admin/users/:id/public-master` | Toggle `is_public_master`. |
| Copy Trading | GET | `/api/admin/copy/followers` | Who follows which public master. |
| Referral Settings | GET/PUT | `/api/admin/referral-settings` | Commission rule config (shape open, `PROJECT_CONTEXT.md` §9). |
| KYC Form Builder | GET/PUT | `/api/admin/kyc-form-template` | Edit fields, publish new version. |
| Sub-Admins & Permissions | GET/POST | `/api/admin/sub-admins` | List/create sub-admin logins. |
| Sub-Admins & Permissions | PUT | `/api/admin/sub-admins/:id/permissions` | Set the `permissions` rows. |
| Branding & Settings | GET/PUT | `/api/admin/branding` | Logo, colours, name, OTP toggle. |
| My Subscription | GET | `/api/admin/subscription` | Plan, amount due, payment history. |
| My Subscription | POST | `/api/admin/subscription/proof` | Upload payment proof for Growwezy to verify. |
| Notifications/Announcements | POST | `/api/admin/announcements` | To all traders or a group. |
| Activity Log | GET | `/api/admin/activity-log` | Balance adjustments + sub-admin actions, filtered to this tenant. |

## Super Admin API (`/api/superadmin/...`) — 17 pages

| Page | Method | Path | Notes |
| --- | --- | --- | --- |
| Landing Page | — | (static marketing page, not API) | |
| Client Application Form | GET | `/api/public/application-form` | **public.** Current published template. |
| Client Application Form | POST | `/api/public/client-applications` | **public.** Submit application + documents. Rejects reserved subdomains. |
| Application Submitted/Status | GET | `/api/public/client-applications/:id/status` | **public**, token-based (emailed link), not session-based. |
| Dashboard | GET | `/api/superadmin/dashboard` | Totals across all clients. |
| Client Applications | GET | `/api/superadmin/client-applications` | Pending/all. |
| Client Applications | POST | `/api/superadmin/client-applications/:id/decision` | Approve → creates `tenants` row, main Admin `users` row, sends login email, all in one DB transaction. Reject + reason. |
| Client List | GET | `/api/superadmin/clients` | Search, status filter. |
| Client Detail | GET | `/api/superadmin/clients/:id` | Stats: traders, deposits, PnL. |
| Client Detail | POST | `/api/superadmin/clients/:id/suspend` | Manual suspend/reactivate. |
| Client Detail | POST | `/api/superadmin/clients/:id/reset-admin-password` | |
| All Traders | GET | `/api/superadmin/traders` | View-only, filter by client. |
| All Orders & Transactions | GET | `/api/superadmin/transactions` | View-only, across clients. |
| Application Form Builder | GET/PUT | `/api/superadmin/application-form-template` | Edit fields, publish. |
| Master Symbol List | GET/POST | `/api/superadmin/symbols` | Add/edit symbols available platform-wide. |
| Billing / Subscriptions | GET | `/api/superadmin/billing` | Per-client due/paid status. |
| Billing / Subscriptions | POST | `/api/superadmin/billing/:id/verify` | Verify uploaded proof. |
| Staff & Permissions | GET/POST | `/api/superadmin/staff` | Growwezy team logins + permissions. |
| Announcements to Clients | POST | `/api/superadmin/announcements` | To all or selected client admins. |
| Activity Log | GET | `/api/superadmin/activity-log` | Growwezy-level entries (`tenant_id IS NULL`, per `DATABASE_SCHEMA.md` §7). |

## Files

| Method | Path | Notes |
| --- | --- | --- |
| POST | `/api/files` | Multipart upload. `purpose` (kyc_doc / payment_proof / logo / application_doc) decides the storage path convention. Returns a `files` row id, used as `proof_file_id` / `documents` elsewhere. Backed by Cloudinary (dev) or S3 (prod) behind the one interface (`ARCHITECTURE.md` §9). |
| GET | `/api/files/:id` | Resolves to a signed/short-lived URL — never a raw public storage URL for KYC docs or payment proofs. |

## WebSocket (`wss://.../ws`)

One connection per logged-in browser tab, scoped by the same session cookie (so it's tenant- and user-bound, same as REST).

| Direction | Message | Notes |
| --- | --- | --- |
| client → server | `subscribe` `{ symbol }` | Start receiving ticks for a symbol, already tenant-adjusted (`ARCHITECTURE.md` §6). |
| client → server | `unsubscribe` `{ symbol }` | |
| server → client | `price` `{ symbol, bid, ask, ts }` | Per-symbol tick stream. |
| server → client | `account_update` `{ equity, freeMargin, marginLevel, positions }` | Pushed whenever the account's open positions or balance change — price-driven PnL changes, a close, a deposit, an admin adjustment. |
| server → client | `position_closed` `{ positionId, reason }` | SL/TP/stop-out/manual — so the terminal UI reacts without polling. |
| server → client | `notification` `{ ...notification row }` | Mirrors a new `notifications` row if the user is online. |

The chart's own data (`getBars`/`subscribeBars`, `ARCHITECTURE.md` §7) rides this same connection, not a second one — one WS per tab, multiplexed by message type.

## Open items — confirm before building

1. **Export format for Transactions Report** (`/api/admin/transactions`) — CSV assumed, not confirmed.
2. **Pagination defaults** (page size) — not decided, low-stakes, pick a default when building.
3. **Rate limiting** on public endpoints (`signup`, `forgot-password`, `client-applications`) — not discussed yet; worth a basic limiter given they're public and email/OTP-sending.
4. Everything the referenced docs already flag as open (referral formula, copy-trading allocation shape, bonus tradability, permissions-table shape) flows into these routes' request bodies once decided — no route changes needed, just payload shape.
