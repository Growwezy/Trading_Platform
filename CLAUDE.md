# CLAUDE.md: Growwezy Trading Platform

## Read first
Before any task, read:
1. `docs/PROJECT_CONTEXT.md`: everything decided so far
2. `docs/SCOPE.md`: index of roles and the end-to-end flow
3. The role file for the part you are working on: `docs/roles/TRADER.md`, `docs/roles/ADMIN.md` or `docs/roles/SUPERADMIN.md` (full flow, rules and page list per role)
4. `docs/PROGRESS.md`: what is done and what is next

**Current phase: PLANNING.** Write docs only. No application code until the docs in `/docs` are reviewed and approved.

## What we are building
- A multi-client (multi-tenant) trading SaaS + broker back-office, built as a **web app** (desktop + mobile browsers).
- Owner: **Growwezy**. Growwezy sells it to brokers (clients). Each broker onboards its own traders.
- Markets: Forex, Crypto, Commodities with live charts.
- Team: 2 developers. Neither is a trading expert, so explain trading logic clearly in docs.

## Roles
1. **Super Admin (Growwezy):** approves client applications, verifies client payments, sees all clients' data (view only), suspends clients manually.
2. **Admin (client / broker):** runs its own subdomain, verifies its traders' KYC, approves deposits and withdrawals, sets symbols, markups and its trader KYC form, creates sub-admins.
3. **Sub-admin:** created by an Admin; can only use the pages and actions it was given.
4. **Trader:** signs up on a client's subdomain, does KYC, deposits, trades, copies and refers.

Page count: Trader 16, Admin 23, Super Admin + master website 17 = **56 pages** (full lists in `docs/roles/`).

## Domains
- Master website + Super Admin: `trade.growwezy.com`
- Each client: `<subdomain>.<platform-domain>` (traders) and `<subdomain>.<platform-domain>/admin` (admin)
- Client picks its subdomain in the application form; it goes live on Super Admin approval.
- Wildcard DNS (`*`) + wildcard SSL. No manual setup per client.
- Block reserved subdomains: `admin`, `api`, `www`, `trade`, `mail`.

## Key business rules
- Legal and compliance are handled by Growwezy. Do not build regulatory flows.
- All payments are verified manually:
  - Client pays Growwezy and uploads proof; Super Admin verifies it.
  - Trader deposits by bank or USDT (BEP20 / TRC20) and uploads proof; client Admin verifies it.
- Approved deposits go straight to the trader's trading balance. No separate wallet for now.
- Before KYC approval a trader can only view charts. No deposit or trading.
- A trader who signs up without a referral code belongs to the client whose subdomain they used.
- Referral code cannot be changed once added. Referral earnings are credited automatically.
- Copy trading: follow your referrer or accounts the Admin has made public. No profit share for masters for now.
- Admin can manually adjust a balance. **Every adjustment must be logged** (who, when, amount, reason).
- Client branding (logo, name) comes from the application form automatically; the Admin can edit it later.
- Super Admin edits the client application form; each Admin edits its own trader KYC form.
- OTP on login: optional toggle for the main Admin only; always on for Super Admin.

## Out of scope for this phase
Demo account, separate wallet, master profit share, PAMM, Leads, Liquidity / LP logs, A-Book / B-Book split, detailed trading logs, Super Admin login-as-client, online payments, auto-suspend, custom client domains, Android / iOS apps, script / strategy editor.

## Open questions (do not assume, ask)
- Referral commission: what it is calculated on, and how many levels.
- Copy trading: how a follower sets the amount or ratio.
- Phase dates and success metrics.
- Final platform name.

## What already exists
- Prototype trading terminal (React + Vite) with live charts from Binance WebSocket (crypto) and Twelve Data (forex / crypto).
- Symbol switching and a shared WebSocket fan-out (one upstream connection per feed / symbol, broadcast to many clients).
- No database yet.
- Twelve Data is on the Basic plan.
- TradingView Advanced Charts: applied for, access not received yet. Keep charts behind a swappable layer and use a fallback chart until then.

## Planned stack (confirm in `docs/TECH_STACK.md`)
- Frontend: React + Vite, Tailwind, TanStack Query (server data), Zustand (live / UI state)
- Backend: Node.js / Express, WebSocket server
- Database: PostgreSQL via Prisma
- Cache / real-time: Redis (price cache, pub/sub)
- Files: Cloudinary or S3 (KYC docs, logos)
- Hosting: AWS (EC2 / ECS). DNS on Cloudflare (domain bought on Hostinger).

## Engineering rules
- **Multi-tenant:** every tenant-owned table has `tenant_id`; every query filters by it. Resolve the tenant once, in middleware, from the request hostname.
- **Money:** never update a balance without writing a transaction record. Balances must be traceable to their records.
- Branding is loaded per tenant at runtime (`/api/tenant/config`); never hard-code a client's name or logo.
- Keep the market-data feed and chart library behind interfaces so providers can be swapped.
- Ask before assuming anything not written in `/docs`.

## Working agreement
- Plan before code; use plan mode for any task bigger than a small fix.
- After each task, update `docs/PROGRESS.md` (done / next) and add any new decision to `docs/DECISIONS.md`.
- Keep docs short and practical. No filler.
