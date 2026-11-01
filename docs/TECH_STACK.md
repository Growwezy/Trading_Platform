# Tech Stack

Confirms the stack from `PROJECT_CONTEXT.md` §7. Decided items first, open items at the end — do not assume an open item, ask.

## Frontend
- **React + Vite** — app framework and dev server.
- **Tailwind CSS** — styling.
- **TanStack Query** — server data (REST calls: history, KYC, deposits, users, etc.), with its own cache and refetching.
- **Zustand** — live / UI state (live prices, open positions, chart settings) that TanStack Query doesn't own.
- **OpenAlgo Charts** (`openalgo-charts` npm package, pinned version) — charting and the trading terminal widget. Behind our own `DataFeed` adapter so the provider can be swapped (engineering rule). See `DECISIONS.md`.
- Validated together in the local terminal test (`Test_Terminal/`, not pushed): React 18.3, Vite 5.4, `openalgo-charts` 2.6.7.

## Backend
- **Node.js + Express** — REST API.
- **`ws`** — WebSocket server, for live prices to the browser and (later) push events (notifications, order fills).
- One shared upstream connection per market-data feed/symbol, fanned out to every subscribed browser client (already proven in the terminal test).
- **Runs in its own Docker container**, in every environment (local dev and the AWS deployment) — one `Dockerfile` for the backend, so "it works on my machine" and "it works on AWS" are the same container. Separate from the database and Redis containers — see why in `DECISIONS.md`.

## Database
- **PostgreSQL** via **Prisma** (ORM + migrations), in every environment — only *where* Postgres runs differs:
  - **While building:** **NeonDB** (managed, serverless Postgres). Both developers point at the same Neon database, so data persists across machines instead of each person having their own disconnected local database.
  - **In production on AWS:** Postgres runs **in its own Docker container** (self-hosted) — separate from the backend's container and Redis's container, not bundled with either. Not Neon, not a managed service like RDS. Its data lives on a persistent mounted volume, outside the container's own filesystem, so a redeploy or restart of the container never wipes it.
  - Same `DATABASE_URL`-style connection string either way — Prisma doesn't care which is behind it — so moving from Neon to the Dockerized instance is a config change, not a code change.
- Every tenant-owned table carries `tenant_id` (engineering rule). Tenant is resolved once in middleware from the request hostname.
- Money rule: a balance never changes without a transaction record row alongside it.

## Cache / real-time
- **Redis** — live price cache (so a late-joining client gets the last tick immediately) and pub/sub (so multiple backend instances can share one upstream feed connection).
- **In production on AWS, runs in its own Docker container**, separate from the backend and from Postgres — same reasoning as the database: an app crash or redeploy shouldn't be able to take Redis down with it, and vice versa.

## Market data
- **Binance WebSocket** — crypto, free, no key needed.
- **Twelve Data** — forex / crypto, **free plan while developing**; switch to a paid plan before production (cost/plan still to be picked — open item below). Free/trial plans cap concurrent WebSocket connections, so the backend pools one connection per symbol across all users (proven in the terminal test).
- Feed behind a `DataFeed`-style interface per provider, same swappable-provider rule as charts.

## Files (KYC documents, client logos)
- **Cloudinary** during development/testing.
- **S3** in production.
- Keep file storage behind one small interface (upload, get URL, delete) so swapping Cloudinary → S3 later touches one module, not every call site.

## Auth: sessions, not JWT
- **Server-side sessions, stored in Redis** (already running it for the price cache/pub-sub, so no new infra), set as an httpOnly, secure, `SameSite` cookie. See reasoning below.
- **OTP:** email-based. Not required on login by default; used to verify the account at sign-up and for forgot-password resets, for every role. Admin's own login OTP is an optional toggle; Super Admin login OTP is always on. (`PROJECT_CONTEXT.md` §4.)

### Why sessions over JWT
- **Instant revocation matters here.** Blocking a trader, suspending a client, or changing a sub-admin's permissions all need to take effect immediately. A session is one `DELETE` in Redis; a JWT needs a blocklist or short expiry + refresh anyway — at that point it's not simpler than a session, just a session with extra moving parts.
- **No native mobile app this phase** (explicitly out of scope) — JWT's main edge, working without cookies for non-browser clients, isn't needed yet.
- **Safer by default for a financial app.** An httpOnly session cookie can't be read by JavaScript, so it's not a target for an XSS-stolen token the way a JWT kept in `localStorage` would be.
- **Scaling is already covered.** Multiple backend instances just read the same Redis-backed session store — no sticky sessions needed.
- Revisit JWT only if a public partner-facing API is added later; even then, issue separate API keys for that rather than reusing the web session mechanism.

## Hosting / DNS
- **AWS** — confirmed for app hosting. Backend, database and Redis each run in their own separate Docker container there (see Backend, Database and Cache above). EC2 vs ECS still to be picked (open item below) — Docker runs on either, so this doesn't block the container design now.
- **Cloudflare** — DNS, wildcard record (`*.<platform-domain>`) + wildcard SSL for client subdomains.
- **Hostinger** — domain registrar only (DNS is on Cloudflare, not Hostinger).
- Render was used on an earlier project; not the current plan, listed here only so it isn't picked up by mistake.

## Dev tooling
- Git/GitHub for source control.
- **Docker**, via `docker-compose` locally — one service each for the backend, Postgres (or Neon instead, see Database above) and Redis, never combined into one container. See `DECISIONS.md` for why.
- Environment secrets (API keys, DB URL) in `.env`, never committed (`.gitignore`). The Neon connection string (dev) and the Dockerized Postgres connection string (production) are both just `DATABASE_URL` values — never hard-coded.

## Open items — do not assume, confirm with the user
1. **Hosting:** EC2 vs ECS to run the Docker containers on, and whether staging/production are separate from day one.
2. **Production Twelve Data plan/cost** once past the free plan (already an open question in `PROJECT_CONTEXT.md` §9).
3. **Node.js version** to standardize on (OpenAlgo Charts' own repo requires Node ≥ 20 for its build tooling — not a constraint on our runtime, but worth matching).
