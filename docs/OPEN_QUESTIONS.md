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

| # | Question | Source |
| --- | --- | --- |
| 10 | Leverage model: trader picks up to a per-symbol maximum, or one fixed leverage per symbol? | `TRADING_ENGINE.md` §4, §13.1 |
| 11 | Margin call / stop-out thresholds: use the proposed 100% / 50% defaults, or different numbers? Configurable per tenant from day one? | `TRADING_ENGINE.md` §9, §13.2 |
| 12 | Order types: market-only acceptable for launch, or are pending Limit/Stop orders needed? | `TRADING_ENGINE.md` §3, §13.3 |
| 13 | Partial close: full-close-only acceptable, or is partial close needed? | `TRADING_ENGINE.md` §10, §13.4 |
| 14 | Account currency: single currency (USD) assumed for every tenant — confirm, no multi-currency/FX conversion planned | `TRADING_ENGINE.md` §13.5 |
| 15 | Swaps (overnight financing): confirm out of scope this phase | `TRADING_ENGINE.md` §13.6 |
| 16 | Minimum/maximum lot size per symbol: real numbers needed before launch | `TRADING_ENGINE.md` §4, §13.7 |
| 17 | Position model: one ticket per trade (proposed), or one combined position per symbol? | `TRADING_ENGINE.md` §2 |

## Infrastructure (engineering-resolvable, but not yet picked)

| # | Question | Source |
| --- | --- | --- |
| 18 | Hosting: EC2 vs ECS; staging and production separate from day one? | `TECH_STACK.md`, `ARCHITECTURE.md` §12.3 |
| 19 | Node.js version to standardize on | `TECH_STACK.md` |
| 20 | Monorepo with three frontend apps + one backend service — confirm or push back | `ARCHITECTURE.md` §12.1 |
| 21 | WebSocket horizontal scaling (multiple backend instances via Redis pub/sub) — confirm that's actually the near-term plan | `ARCHITECTURE.md` §12.2 |
| 21a | Workspace tooling: plain npm/pnpm workspaces (proposed) vs Turborepo/Nx | `ARCHITECTURE.md` §0, §12.1 |

## Data model (small, confirmable quickly)

| # | Question | Source |
| --- | --- | --- |
| 22 | `permissions` as its own table vs a JSONB column on `users` | `DATABASE_SCHEMA.md` §9.1, `ROLES_PERMISSIONS.md` |
| 23 | Permission granularity: per-page vs per-action within a page | `ROLES_PERMISSIONS.md` |
| 24 | `activity_log` as one shared table vs two separate ones (Admin / Super Admin) | `DATABASE_SCHEMA.md` §9.2 |
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
