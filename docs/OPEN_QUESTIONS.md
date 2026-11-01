# Open Questions

Every unresolved item across `/docs`, in one place, so nothing needs hunting through individual files to find what's still waiting on the user. Each doc keeps its own "Open items" section too (closer to the relevant detail) — this is the index. Remove an item here (and in its source doc) once it's answered, and log the answer in `DECISIONS.md`.

**Do not assume any of these — ask, per `CLAUDE.md`.**

## Business / product (need the user, not engineering judgment)

| # | Question | Source |
| --- | --- | --- |
| 1 | Referral commission: calculated on what (deposit amount, trading volume, fixed), and how many levels deep? | `PROJECT_CONTEXT.md` §9.1, `docs/roles/TRADER.md`, `docs/roles/ADMIN.md` |
| 2 | Copy trading: how does a follower set their amount or ratio relative to the master? | `PROJECT_CONTEXT.md` §9.2, `TRADING_ENGINE.md` §11 |
| 3 | Bonus: is a granted bonus tradable-only, or withdrawable? | `docs/roles/ADMIN.md`, `DATABASE_SCHEMA.md` §4 |
| 4 | Phase dates and success metrics | `PROJECT_CONTEXT.md` §9.5, `PHASES.md` |
| 5 | Final platform name | `PROJECT_CONTEXT.md` §9.6 |
| 6 | Pricing plans for clients (2–3 plans, platform-provided account vs client's own, configurable spread; upfront + monthly) and the referral model for selling to brokers | `PROJECT_CONTEXT.md` §9.7, `docs/roles/SUPERADMIN.md` |
| 7 | Production market-data plan and monthly cost (Twelve Data, once past free tier) | `PROJECT_CONTEXT.md` §9.4, `TECH_STACK.md` |
| 8 | Default KYC form fields a brand-new client starts with, before they customize it | `docs/roles/ADMIN.md` |
| 9 | Exact URL path for the Super Admin panel on the master site | `docs/roles/SUPERADMIN.md` |

## Trading engine (need the user's risk/product call)

Items 10, 12–17 **resolved 2026-11-01** to the defaults already proposed in `TRADING_ENGINE.md` — see §13 there and `DECISIONS.md`. Item 17 (one ticket per trade, not one combined position per symbol) matches the `positions`/`position_history` tables already in `backend/prisma/schema.prisma`. Item 11 (margin call/stop-out %) resolved to the 100%/50% default for building, but sent to the client for confirmation alongside max leverage per asset class — not a blocker, update once they reply.

## Infrastructure (engineering-resolvable, but not yet picked)

| # | Question | Source |
| --- | --- | --- |
| 18 | Hosting: EC2 vs ECS; staging and production separate from day one? | `TECH_STACK.md`, `ARCHITECTURE.md` §12.3 |
| ~~19~~ | ~~Node.js version~~ — **resolved 2026-11-01: Node 22** (`backend/Dockerfile`), `engines >= 20` | `TECH_STACK.md`, `DECISIONS.md` |
| 20 | Monorepo with three frontend apps + one backend service — confirm or push back. **Partially settled:** backend runs as its own standalone npm project for now; root workspace config deliberately deferred until the frontend trader app is scaffolded | `ARCHITECTURE.md` §12.1, `DECISIONS.md` |
| 21 | WebSocket horizontal scaling (multiple backend instances via Redis pub/sub) — confirm that's actually the near-term plan | `ARCHITECTURE.md` §12.2 |
| ~~21a~~ | ~~Workspace tooling~~ — **resolved 2026-11-01: plain npm**, not pnpm | `DECISIONS.md` |

## Data model (small, confirmable quickly)

| # | Question | Source |
| --- | --- | --- |
| ~~22~~ | ~~`permissions` as its own table vs a JSONB column on `users`~~ — **resolved 2026-11-01: own table** | `DATABASE_SCHEMA.md` §9.1, `DECISIONS.md` |
| 23 | Permission granularity: per-page vs per-action within a page | `ROLES_PERMISSIONS.md` |
| ~~24~~ | ~~`activity_log` as one shared table vs two separate ones~~ — **resolved 2026-11-01: one shared table** | `DATABASE_SCHEMA.md` §9.2, `DECISIONS.md` |
| 25 | Default markup for a trader with no group assigned | `DATABASE_SCHEMA.md` §9.3 |
| 26 | Default permission grant set for a brand-new sub-admin (none ticked, recommended, vs a starter set) | `ROLES_PERMISSIONS.md` |

## API-level (low-stakes, pick a sensible default when building)

| # | Question | Source |
| --- | --- | --- |
| 27 | Transactions Report export format (CSV assumed) | `API_SPEC.md` |
| 28 | Pagination page-size default | `API_SPEC.md` |
| 29 | Rate limiting on public endpoints (signup, forgot-password, client application) | `API_SPEC.md` |

## Longer-term / explicitly deferred (not blockers now)

- Trade execution model long-term beyond dealing-desk/B-Book (`PROJECT_CONTEXT.md` §9.3) — A-Book/B-Book split is out of scope this phase by design, not an oversight.
- Super Admin staff resource/permission list hasn't been itemized yet (`ROLES_PERMISSIONS.md`).
