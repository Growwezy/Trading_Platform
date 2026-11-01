# Phases

What gets built in what order, and why — based on what each piece depends on. **Not calendar dates.** `CLAUDE.md` and `PROJECT_CONTEXT.md` §9 both list "phase dates and success metrics" as an open question to ask about, not assume — so this doc proposes sequencing only. Add real dates once the user sets them.

## Why this order

Everything here builds on a dependency, not a preference:
- Nothing works without tenants and auth (every other table has a `tenant_id`, every route needs a session).
- Trading can't be tested meaningfully without a trader who has a balance, which needs KYC + deposits working first.
- Referral and copy trading both depend on trading already existing (a copy trade is just another call into the same engine, per `TRADING_ENGINE.md` §11).
- Admin back-office tooling (sub-admins, activity log, reports) matters most once there's real activity to manage, not before.

## Phase 1 — Foundation

- Multi-tenant resolution from hostname, reserved-subdomain blocking.
- `tenants`, `users` tables; sessions in Redis; the three separate logins (trader / admin / super admin) with their OTP rules.
- Super Admin: Client Application Form (public) → review → approve → auto-created tenant + admin login + branding. This is the only way a tenant comes into existence, so it has to exist before anything tenant-side can be tested end to end.
- Tenant branding loaded at runtime (`/api/tenant/config`).

## Phase 2 — Trader onboarding and money in/out

- Trader sign-up, KYC form (Admin's KYC Form Builder + trader submission + Admin review).
- Deposit flow (payment methods, proof upload, Admin approval → balance).
- Withdrawal flow (request → Admin approval → paid).
- `transactions` ledger wired in from the start — this is the pattern every later money-touching feature reuses.
- View-only charts/markets before KYC approval.

## Phase 3 — The trading engine

- Market data pipeline: feed adapters, Redis cache/pub-sub, per-tenant markup, WebSocket fan-out (`ARCHITECTURE.md` §6).
- Chart integration (`openalgo-charts` + the `DataFeed` adapter).
- Order placement, open positions, SL/TP, close, PnL/equity/margin formulas, margin call/stop-out (`TRADING_ENGINE.md`).
- Symbol configuration (Super Admin master list → Admin's Symbol Settings, Groups & Markups).
- This is flagged in `PROJECT_CONTEXT.md` §1 as the current priority ("the trading experience must be as good as possible") — worth treating as its own focused phase rather than splitting it across others.

## Phase 4 — Referral and copy trading

- Referral code capture, referral link, earnings credited automatically (formula pending — `PROJECT_CONTEXT.md` §9, item 1).
- Copy trading: follow/stop, public masters, mirrored orders through the same trading engine path (allocation shape pending — item 2).
- Deliberately after Phase 3, since both features are thin layers on top of a trading engine that already works — building them earlier would mean building against a moving target.

## Phase 5 — Admin back-office depth

- Sub-admins & permissions, Activity Log, Bonus, Transactions Report/export, Notifications/Announcements.
- My Subscription (client → Growwezy billing) and Super Admin's Billing/Subscriptions verification.
- Super Admin monitoring views (All Traders, All Orders & Transactions, Client List/Detail, suspend/reactivate).
- These pages matter most once there's real traders/trades/money to manage — building them first would mean testing against empty data.

## Deliberately not phased in

Everything in `CLAUDE.md`'s out-of-scope list (demo account, separate wallet, master profit share, PAMM, Leads, Liquidity/LP logs, A-Book/B-Book split, detailed trading logs, Super Admin login-as-client, online payments, auto-suspend, custom domains, native apps, script/strategy editor) — not a later phase, just not planned at all right now. Revisit only if the user explicitly brings one back into scope.

## Open items — these need the user's answer, not an engineering guess

1. **Calendar dates** for each phase — not proposed here at all; depends on team capacity and any external commitment (e.g. a client waiting on a go-live date), which only the user knows.
2. **Success metrics** per phase (e.g. "Phase 1 done" = what, exactly?) — same reason.
3. Whether Phase 3 (trading engine) should start in parallel with Phase 2's back half, given it's called out as the current top priority — or stay strictly sequential as laid out above.
