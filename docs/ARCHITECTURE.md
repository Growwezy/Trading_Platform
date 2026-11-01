# Architecture

How the pieces in `TECH_STACK.md` fit together: tenant resolution, auth, the price pipeline, the chart, the trading engine, and where money correctness is enforced. Proposed items are marked **(proposed)** — confirm before building, per the working agreement.

## 1. System overview

```
Browser (trader / admin / super admin)
   │  HTTPS + WSS
   ▼
Cloudflare (DNS, wildcard SSL for *.<platform-domain>)
   │
   ▼
AWS — backend container (Express + ws), behind a load balancer (proposed)
   │               │                    │
   ▼               ▼                    ▼
PostgreSQL      Redis               Cloudinary / S3
(own Docker     (own Docker         (KYC docs,
 container,      container:          client logos)
 tenant data,    sessions, price
 transactions)   cache, pub/sub)
   │
   ▼
Upstream market data: Binance WebSocket, Twelve Data
```

**Dev vs production, same code, different Postgres:** while building, both developers run the backend against one shared **NeonDB** database (so data persists across machines instead of two disconnected local databases). On AWS, Postgres and Redis each run in their **own separate Docker container**, apart from the backend's — not Neon, not a managed RDS/ElastiCache, and never all bundled into one container. Only the `DATABASE_URL` (and Redis connection string) change between dev and production; nothing in the application code does. See `DECISIONS.md` for why they're kept apart: an app crash or redeploy must never be able to take the database or Redis down with it.

Everything a browser talks to goes through one backend. The backend is the only thing that talks to Postgres, Redis, the file store, and the upstream price feeds — nothing upstream is ever called directly from the browser.

## 2. Multi-tenancy

- **Tenant = client (broker).** Resolved once per request, in middleware, from the request hostname:
  - `trade.growwezy.com` → no tenant; this is Growwezy itself (master website + Super Admin).
  - `<subdomain>.<platform-domain>` and `<subdomain>.<platform-domain>/admin` → tenant = the client that owns that subdomain.
- Reserved subdomains (`admin`, `api`, `www`, `trade`, `mail`) are rejected at application-form submission time, not just at routing time — a client can never apply for one.
- **Every tenant-owned table carries `tenant_id`, and every query filters by it.** This is enforced at the data-access layer (e.g. a Prisma middleware or a thin repository wrapper that injects `tenant_id` into every query), not left to each route handler to remember.
- **A session is bound to one tenant.** Even though cookies are scoped to a specific host already (see §3), the backend re-checks on every request that the session's `tenant_id` matches the tenant resolved from the current hostname. A trader's session from `clienta.platform.com` is rejected outright on `clientb.platform.com`, even if it were somehow replayed there. Super Admin sessions are the one exception — not tied to a tenant, since Super Admin legitimately reads across all of them (view only).

## 3. Auth & sessions

Decided in `TECH_STACK.md`: server-side sessions in Redis, httpOnly + secure + `SameSite` cookie, not JWT.

- **Cookie scope:** set to the exact host, not a wildcard across `*.<platform-domain>`. A trader's cookie on `clienta.platform.com` is never sent to `clientb.platform.com` — the browser itself won't do it, and the `tenant_id` check in §2 is the backstop.
- **Trader and Admin are separate logins on the same host** (`clienta.platform.com` vs `clienta.platform.com/admin`). They get separate session cookies (different cookie names) so being logged in as a trader never implies anything about the admin session, and vice versa.
- **Sub-admin is a login with restrictions, not a separate role in the data model.** It is an Admin-side account row with a `permissions` set (which pages, which actions — e.g. "KYC Requests: view + approve", "Deposit Requests: view only"). Every sub-admin request is checked against that set in backend middleware, not just hidden in the UI — the UI hides what a sub-admin can't do, but the API refuses it independently, since a hidden button is not an access control.
- **OTP** (from `PROJECT_CONTEXT.md` §4): not part of the login session check itself except for Admin (toggle) and Super Admin (always). For sign-up and forgot-password, OTP is a short-lived, single-purpose code in Redis (keyed to the email + purpose), checked once and discarded — it never becomes a session on its own.

## 4. Frontend structure (proposed)

Three separate single-page apps, one monorepo, sharing common packages:

| App | Serves | Pages |
| --- | --- | --- |
| `apps/trader` | `<subdomain>.<platform-domain>/` | 16 |
| `apps/admin` | `<subdomain>.<platform-domain>/admin` | 23 |
| `apps/superadmin` | `trade.growwezy.com` (+ the public marketing pages) | 17 |

Shared packages: `packages/ui` (components, theme), `packages/api-client` (typed REST calls via TanStack Query), `packages/chart-feed` (the OpenAlgo Charts `DataFeed` adapter, §6).

**Why three apps instead of one:** a trader never downloads admin code and vice versa (smaller bundles, cleaner permission boundaries by construction), and the three surfaces genuinely have almost no shared screens. The cost is some duplicated scaffolding (routing, auth check on load) — small for a 2-person team using shared packages.

## 5. Backend structure (proposed)

**One Node/Express service to start**, not split into microservices — a 2-person team doesn't benefit from that overhead yet, and nothing here needs independent scaling right away. Organized internally by domain, not by role:

```
server/
  modules/
    tenants/        onboarding, branding, subdomain lifecycle
    auth/           login, OTP, sessions
    kyc/            trader KYC form + review
    funds/          deposits, withdrawals, balance adjustments (writes a transaction row every time)
    symbols/        master symbol list, per-tenant enable/markup
    trading/        orders, positions, SL/TP (the trading engine)
    referrals/      referral codes, copy trading
    notifications/  in-app notification center
  feeds/            Binance, Twelve Data adapters behind one DataFeed-style interface
  ws/                WebSocket server: price fan-out + account push events
```

If a part genuinely needs to scale or deploy separately later (most likely candidate: the price-feed/WebSocket layer, since it holds persistent upstream connections), it can be split out without touching the others — they only talk to each other in-process today, not over the network, so splitting later is a deployment change, not a rewrite.

## 6. Market data & the price pipeline

This is the part most worth being explicit about, since prices feed both the chart and real money (fills, SL/TP, PnL).

1. **One upstream connection per `provider:symbol`**, shared across every tenant and every user watching that symbol — already proven in the terminal test. Binance and Twelve Data don't know tenants exist.
2. Each tick is cached in Redis (`price:<provider>:<symbol>`) and published to a Redis pub/sub channel, so any backend instance can pick it up (this is what makes horizontal scaling of the WebSocket layer possible later, per §5).
3. **Markup is applied per tenant, after the raw tick, before it reaches a browser or a fill.** The Admin's "Groups & Markups" page sets a spread markup per symbol or user group. So the pipeline for a price shown to one specific trader is:
   `raw tick (shared) → look up that trader's tenant + group markup → adjusted bid/ask → sent to that trader's WebSocket connection`
   The same raw tick produces a different displayed/traded price for traders in different tenants or groups. This lookup has to happen on every tick for every connected client, not once — markups can change, and a trader must never see or trade on the raw unmarked-up price.
4. **The same adjusted price is what the trading engine uses for fills and SL/TP checks** — the chart display and the trade execution price must come from the same place, or a trader could see one price and get filled at another.
5. Symbols a tenant hasn't enabled are simply never sent to that tenant's clients — filtered at the fan-out step, from the Super Admin's master symbol list minus whatever the Admin disabled.

## 7. Chart integration

- `openalgo-charts` widget on the frontend, fed by a custom `DataFeed` (in `packages/chart-feed`) that calls our own backend — `getBars` for history, `subscribeBars` for live ticks over our WebSocket. The chart never talks to Binance or Twelve Data directly; it only ever sees our already-tenant-adjusted prices from §6.
- Branding: `branding: false` on the widget so each tenant's own logo/colours (loaded via `/api/tenant/config`, per the engineering rules) render instead of OpenAlgo's.
- Kept behind this one adapter specifically so the provider can change later without touching every page that shows a chart (engineering rule).

## 8. Trading engine & money flow

Full mechanics (lot sizing, margin formula, order types) belong in `TRADING_ENGINE.md`, not duplicated here. Architecturally, the rule that matters everywhere else in the system:

> **A balance never changes without a transaction record written in the same database transaction.** Deposit approval, withdrawal, manual adjustment, trade close, referral payout — every one of these is one DB transaction that writes the new balance *and* a row saying why. If the write of one half fails, both roll back.

- Orders are placed against the tenant-adjusted price from §6, not a raw feed price.
- SL/TP is checked on every tick for every open position (as in the terminal test) and closes through the same balance+transaction path as a manual close — there is no separate "automatic" code path that skips the transaction record.
- Manual balance adjustments (Admin) go through the identical path, which is what makes the Activity Log and the user's own transaction history always consistent with the actual balance.

## 9. File storage

One small interface — `upload(file, tenantId, purpose)`, `getUrl(fileId)`, `delete(fileId)` — implemented first against Cloudinary (dev/test, per `TECH_STACK.md`) and later against S3 (production), so the swap is one module. KYC documents and payment proofs are tenant-scoped by convention in the storage path/key, even though the real access control is still the `tenant_id` check on the database row that references the file.

## 10. Notifications

In-app only for this phase (no email/SMS delivery system beyond OTP and account emails already covered). Events that create a notification row (KYC approved/rejected, deposit approved, withdrawal update, admin announcement) are written to the database and pushed over the same WebSocket connection if the user is online; the Notification Center page is just that table, read either way.

## 11. Deployment topology

- **Building phase:** backend runs in Docker locally; database is the shared **NeonDB** instance (both developers point at the same one), not a per-machine local Postgres. This is what makes data persist across devices during development.
- **Production, on AWS:** backend, Postgres and Redis each run **in their own separate Docker container** — not Neon, not a managed RDS/ElastiCache, and deliberately not combined into one container. EC2 vs ECS still open (per `TECH_STACK.md`) for *what* runs the containers, but the container design itself is decided: a crash or redeploy of the backend must never be able to take the database or Redis down with it, and vice versa.
- Cloudflare: DNS + wildcard SSL in front of everything, in both phases.
- Static frontend builds (the three SPAs) served from a CDN/static host, not the backend container.

## 12. Open items — confirm before building

1. **Monorepo with three frontend apps, one backend service** (§4, §5) — proposed here, not previously decided. Confirm or push back.
2. **WebSocket scaling**: the Redis pub/sub design in §6 assumes more than one backend instance eventually; confirm that's actually the plan, or this can simplify.
3. Everything still open from `TECH_STACK.md` §"Open items" (EC2 vs ECS, Twelve Data production plan, Node version) feeds into §11 here once decided.
