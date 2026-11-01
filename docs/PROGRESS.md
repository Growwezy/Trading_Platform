# Progress

Update after every task: move items between sections, add the date.

## Done
- 2026-10-27: Prototype terminal with live Binance and Twelve Data charts, symbol switching, shared WebSocket fan-out.
- 2026-10-27: Scope agreed: 3 roles, 56 pages (`SCOPE.md`).
- 2026-10-27: Client scope document and kickoff deck prepared.
- 2026-10-27: `CLAUDE.md`, `PROJECT_CONTEXT.md`, `SCOPE.md` written.
- 2026-10-27: Planning docs moved into `docs/` to match `CLAUDE.md`.
- 2026-10-28: Detailed per-role specs written (`docs/roles/TRADER.md`, `ADMIN.md`, `SUPERADMIN.md`); `SCOPE.md` is now an index pointing to them.
- 2026-10-28: Evaluated `openalgo-charts` (open-source charting library) for the trading terminal; decided to use it via npm. Local clone kept out of git (reference only).
- 2026-10-28: Built `Test_Terminal/` (local only, not pushed) — a terminal + API test proving `openalgo-charts` + a custom Node/WebSocket backend + an in-memory paper-trading engine (leverage, margin, auto SL/TP) all work together. Decision locked in: OpenAlgo Charts replaces TradingView Advanced Charts for now.
- 2026-10-28: `docs/TECH_STACK.md` written — confirms frontend, backend, DB, cache, market data and charts; flags files, hosting, auth and Node version as still open.
- 2026-10-28: Resolved auth (sessions in Redis, not JWT), OTP rule (sign-up + forgot-password only, not login by default), files (Cloudinary dev / S3 production) and hosting (AWS confirmed, EC2 vs ECS still open). Updated `TECH_STACK.md`, `CLAUDE.md`, `PROJECT_CONTEXT.md`, `docs/roles/TRADER.md`.
- 2026-10-28: `docs/ARCHITECTURE.md` written — tenant resolution, session/cookie scoping, the per-tenant markup step in the price pipeline, chart integration, where the money/transaction rule is enforced, and file storage. Proposes a 3-app monorepo + one backend service (not yet confirmed).
- 2026-10-28: `docs/TRADING_ENGINE.md` written — concepts explained plainly (lot, leverage, margin, equity, PnL) with a worked example, ticket-based position model, bid/ask synthesized from last price + spread + markup, margin/PnL formulas, margin call/stop-out, and the module's boundary with funds/referrals/copy-trading. Several proposed defaults flagged for confirmation.
- 2026-10-31: Decided backend runs in Docker everywhere; database is NeonDB while building (shared/persists across both developers' machines), Postgres-in-Docker on AWS in production (not RDS). Updated `TECH_STACK.md` and `ARCHITECTURE.md` (system diagram, deployment topology, open items — Redis's production hosting is now the only piece of that puzzle still open).
- 2026-11-01: Decided production runs backend, Postgres and Redis in three separate Docker containers, not combined into one — so an app crash or redeploy can't take the database or Redis down with it. Updated `TECH_STACK.md` and `ARCHITECTURE.md`; this also closes the "Redis hosting in production" open item from the previous entry.
- 2026-11-01: `docs/DATABASE_SCHEMA.md` written — derived from the 56 pages and `TRADING_ENGINE.md`'s formulas, not guessed from scratch. One `users` table for every role; configurable forms (KYC, client application) stored as JSONB against their own template rather than fixed columns; `transactions` as the one ledger every balance change writes through; ticket-based `positions`/`position_history`. Sessions and OTP deliberately left out — they live in Redis, not here.
- 2026-11-01: `docs/API_SPEC.md` written — REST routes for all 56 pages across the three surfaces (`/api/trader`, `/api/admin`, `/api/superadmin`), plus shared auth/tenant/file routes and the WebSocket message set. Routes map directly onto `DATABASE_SCHEMA.md` tables; no new design decisions, just the surface.

## In progress
- Planning docs still to write: ROLES_PERMISSIONS, PHASES, GLOSSARY, OPEN_QUESTIONS.

## Next
- Review and approve `ARCHITECTURE.md`, `TRADING_ENGINE.md` and `DATABASE_SCHEMA.md`, especially their proposed items (listed in each doc's own Open items section).
- Decide the remaining open items in `TECH_STACK.md` (EC2 vs ECS, Twelve Data production plan, Node version).
- Build the real platform fresh (not from `Test_Terminal/`, which was a disposable spike): database, multi-tenant setup, then real trade logic (orders, SL / TP, PnL) per `TRADING_ENGINE.md` once written.
