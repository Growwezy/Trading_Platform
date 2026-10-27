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

## Database
- **PostgreSQL** via **Prisma** (ORM + migrations).
- Every tenant-owned table carries `tenant_id` (engineering rule). Tenant is resolved once in middleware from the request hostname.
- Money rule: a balance never changes without a transaction record row alongside it.

## Cache / real-time
- **Redis** — live price cache (so a late-joining client gets the last tick immediately) and pub/sub (so multiple backend instances can share one upstream feed connection).

## Market data
- **Binance WebSocket** — crypto, free, no key needed.
- **Twelve Data** — forex / crypto, Basic plan (paid key in hand). Trial/basic plans cap concurrent WebSocket connections, so the backend pools one connection per symbol across all users (proven in the terminal test).
- Feed behind a `DataFeed`-style interface per provider, same swappable-provider rule as charts.

## Files (KYC documents, client logos)
- **Cloudinary or S3** — not decided yet. Open item below.

## Hosting / DNS
- **AWS** (EC2 or ECS) — app hosting. Not decided which. Open item below.
- **Cloudflare** — DNS, wildcard record (`*.<platform-domain>`) + wildcard SSL for client subdomains.
- **Hostinger** — domain registrar only (DNS is on Cloudflare, not Hostinger).
- Render was used on an earlier project; not the current plan, listed here only so it isn't picked up by mistake.

## Dev tooling
- Git/GitHub for source control.
- Environment secrets (API keys, DB URL) in `.env`, never committed (`.gitignore`).

## Open items — do not assume, confirm with the user
1. **Files:** Cloudinary vs S3 — pick one before building KYC upload and logo upload.
2. **Hosting:** EC2 vs ECS, and whether staging/production are separate from day one.
3. **Auth approach:** sessions vs JWT, how OTP (email or app-based) is delivered — not yet decided anywhere; needed before `ARCHITECTURE.md`'s auth section.
4. **Production market-data cost/plan** once beyond Twelve Data's Basic plan (already an open question in `PROJECT_CONTEXT.md` §9).
5. **Node.js version** to standardize on (OpenAlgo Charts' own repo requires Node ≥ 20 for its build tooling — not a constraint on our runtime, but worth matching).
