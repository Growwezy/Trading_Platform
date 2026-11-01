# Database Schema

The tables PostgreSQL (via Prisma) needs, derived from what's already decided in `SCOPE.md`, `docs/roles/*.md`, `ARCHITECTURE.md` and `TRADING_ENGINE.md` — this doc isn't guessing at fields, it's turning those decisions into tables. Not a one-time contract: Prisma migrations add columns later as they're discovered. Proposed items are marked **(proposed)**.

**Naming:** `snake_case` tables and columns, as is conventional for Postgres. `tenant_id` means "the client/broker this row belongs to" — per the engineering rule, every query filters by it. A handful of tables are Growwezy's own and have no `tenant_id` at all — called out explicitly where that's the case, so it's never ambiguous.

**Not in this file:** sessions and OTP codes. Both live in Redis, not Postgres (`TECH_STACK.md`, `ARCHITECTURE.md` §3) — short-lived, not the kind of data that needs a relational table or a migration.

## 1. Tenancy and identity

**`tenants`** — one row per client/broker.
`id, subdomain (unique), company_name, logo_url, brand_colors, status (active/suspended), admin_otp_enabled, created_at`

**`users`** — one table for every human who logs in: trader, admin, sub-admin, and Growwezy's own Super Admin / staff.
`id, tenant_id (null for Super Admin / Growwezy staff), role (trader/admin/sub_admin/super_admin/staff), email, password_hash, status (active/blocked), referred_by_user_id (nullable), referral_code (nullable, unique, set-once per the referral rule), created_at`

One table, not five, because auth (login, password, OTP) works identically for all of them — only `role` and `tenant_id` change what they can do, which is exactly what `ARCHITECTURE.md` §3 already assumes.

**`permissions`** **(proposed)** — one row per page/action a sub-admin (or a Growwezy staff login) was granted.
`id, user_id, resource (e.g. "kyc_requests"), can_view, can_edit`
A dedicated table so a permission check is a normal indexed query, not a JSON field the backend has to parse on every request. Confirm this shape, or a single JSONB `permissions` column on `users` works too if that's preferred.

## 2. Onboarding forms

Both the client application form and the trader KYC form are **admin-built** (Form Builder pages), so their fields are never fixed columns — they're whatever that form's template currently defines, submitted as structured data against it.

**`application_form_template`** — Growwezy's own, no `tenant_id`. One current version.
`id, fields (JSONB: field definitions), published_at`

**`client_applications`** — a company's submission, before it becomes a tenant.
`id, company_name, preferred_subdomain, submitted_data (JSONB, shaped by the template above), documents (file references, §8), status (pending/approved/rejected), reviewed_by_user_id, reviewed_at, rejection_reason, created_at`
Approval creates the `tenants` row and the main admin's `users` row — this table is the "before" state, `tenants`/`users` are the "after."

**`kyc_form_templates`** — one per tenant, since each client edits its own.
`id, tenant_id, fields (JSONB), published_at`

**`kyc_submissions`**
`id, tenant_id, user_id (the trader), submitted_data (JSONB), documents (§8), status (pending/approved/rejected), reviewed_by_user_id, reviewed_at, rejection_reason, created_at`

## 3. Symbols and trading configuration

**`symbols`** — Growwezy's master list, no `tenant_id`.
`id, code (e.g. "EURUSD", "BTCUSDT"), asset_class (forex/crypto/commodity), provider (binance/twelvedata), contract_size, base_spread_points, max_leverage`

**`tenant_symbols`** — which master symbols a tenant turned on, and its own limits within them.
`id, tenant_id, symbol_id, enabled, leverage_cap (≤ the master's max_leverage), min_lot, max_lot, trading_hours (JSONB)`

**`groups`** — a tenant's trader groups, for markup assignment.
`id, tenant_id, name`

**`group_markups`**
`id, tenant_id, group_id, symbol_id (nullable = every symbol), markup_points`

A trader's group is just a `group_id` column on `users` (nullable; traders with no group get the tenant's default markup, however that's defined — still open, see §9).

## 4. Money — the ledger, and everything that writes to it

This is the table the engineering money rule exists for: **nothing in this file changes a balance without a row here.**

**`transactions`**
`id, tenant_id, user_id (the trader), type (deposit/withdrawal/trade_close/manual_adjustment/bonus/referral_credit), amount (signed), balance_after, reference_table, reference_id, created_by_user_id (nullable — null for system-triggered, e.g. an SL/TP close), reason (required for manual_adjustment), created_at`
`reference_table`/`reference_id` point at whichever row caused it (a `deposits` row, a `positions` row, etc.) — so every balance change is traceable back to the thing that caused it, not just a label.

**`users.balance`** — the trader's current trading balance lives as a column on `users`, not a separate table (no separate wallet, per the rules). Every write to it happens in the same database transaction as the matching `transactions` row — one commits, or neither does.

**`deposits`**
`id, tenant_id, user_id, amount, method (bank/usdt_bep20/usdt_trc20), proof_file_id (§8), status (pending/approved/rejected), reviewed_by_user_id, reviewed_at, rejection_reason, created_at`
Approval writes the `transactions` row and updates `users.balance` together.

**`withdrawals`**
`id, tenant_id, user_id, amount, method, status (pending/approved/rejected/paid), reviewed_by_user_id, reviewed_at, paid_at, created_at`

**`bonuses`**
`id, tenant_id, user_id, amount, tradable_only (boolean — still an open question in `docs/roles/ADMIN.md`), created_by_user_id, reason, created_at`

**`billing_subscriptions`** — client (tenant) → Growwezy, separate ledger from trader money entirely.
`id, tenant_id, period_start, period_end, amount_due, proof_file_id, status (pending/verified), verified_by_user_id, verified_at`

## 5. Trading: positions

Follows the ticket-based model from `TRADING_ENGINE.md` §2 — one row per trade, not merged per symbol.

**`positions`** (open)
`id, tenant_id, user_id, symbol_id, side (buy/sell), lots, units, leverage, entry_price, stop_loss (nullable), take_profit (nullable), required_margin, opened_at`

**`position_history`** (closed) — same columns as `positions`, plus:
`close_price, realized_pnl, close_reason (manual/stop_loss/take_profit/stop_out), closed_at`

A close moves the row from one table to the other and writes the matching `transactions` row, all in one database transaction (`TRADING_ENGINE.md` §10).

## 6. Referral and copy trading

Referral is mostly already covered: `referred_by_user_id` and `referral_code` live on `users` (§1). The commission formula itself is still an open question (`PROJECT_CONTEXT.md` §9) — whatever it resolves to, it just produces a row in `transactions` with `type = referral_credit`; no schema change needed once decided.

**`copy_follows`**
`id, tenant_id, follower_user_id, master_user_id, allocation (JSONB — fixed amount or ratio, shape still open per `PROJECT_CONTEXT.md` §9), status (active/stopped), started_at, stopped_at`

**`users.is_public_master`** (boolean, nullable, admin-set) — whether this trader's account is one of the Admin's listed public masters.

## 7. Operations

**`activity_log`** **(proposed: one shared table)**
`id, tenant_id (null = this is a Growwezy/Super Admin-level entry), actor_user_id, action (e.g. "balance_adjusted", "client_suspended"), target_table, target_id, details (JSONB), created_at`
One table for both the Admin's Activity Log and the Super Admin's, filtered by whether `tenant_id` is set — proposed for simplicity; splitting into two tables is a reasonable alternative if that reads clearer later.

**`notifications`**
`id, tenant_id, user_id, type, message, read_at (nullable), related_table, related_id, created_at`

**`announcements`**
`id, tenant_id (null = Growwezy announcing to clients), sender_user_id, audience (all/group), group_id (nullable), message, created_at`

## 8. Files

**`files`** — a row per uploaded file, regardless of whether the bytes sit in Cloudinary (dev) or S3 (production) — the storage interface from `ARCHITECTURE.md` §9 writes one of these alongside every upload.
`id, tenant_id (nullable — a tenant's own logo has one; a client's own application documents may predate the tenant existing), purpose (kyc_doc/payment_proof/logo/application_doc), storage_key, uploaded_by_user_id, created_at`

## 9. Open items — confirm before building

1. **`permissions` as a table vs a JSONB column on `users`** (§1).
2. **`activity_log` as one shared table vs two separate ones** (§7).
3. **Default markup for a trader with no group** (§3) — not stated anywhere yet.
4. **Referral commission formula and copy-trading allocation shape** (§6) — already tracked as open in `PROJECT_CONTEXT.md` §9; this schema just needs to know once they're decided, not before.
5. **Bonus tradability** (`bonuses.tradable_only`, §4) — already flagged open in `docs/roles/ADMIN.md`.
