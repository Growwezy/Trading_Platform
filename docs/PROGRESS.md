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
- 2026-11-01: `docs/ROLES_PERMISSIONS.md` written — cross-cutting permission matrix (resource × role), the sub-admin/staff grant model, and trader account-state gating.
- 2026-11-01: `docs/GLOSSARY.md` written — plain-language definitions of trading terms and platform terms, for the non-trading-expert team.
- 2026-11-01: `docs/PHASES.md` written — build-order sequencing (foundation → onboarding/money → trading engine → referral/copy trading → admin depth), derived from what depends on what. Calendar dates and success metrics deliberately left unanswered — `CLAUDE.md` lists them as "ask, don't assume."
- 2026-11-01: `docs/OPEN_QUESTIONS.md` written — single index of every open item across all docs (29 numbered items, categorized: business/product, trading engine, infrastructure, data model, API-level), each pointing back to its source doc.

**All planning docs from `CLAUDE.md`'s "Read first" list, plus the originally-listed set, are now written.** Current phase is still PLANNING per `CLAUDE.md` — these docs need the user's review/approval, and the open items in `OPEN_QUESTIONS.md` need answers, before any application code starts.

## In progress
- Nothing queued — awaiting the user's review of all docs and answers to `OPEN_QUESTIONS.md`.

## Next
- Review and approve every doc in `/docs`, especially the proposed items each one flags.
- Get answers to `docs/OPEN_QUESTIONS.md` — business/product items first (referral formula, copy-trading ratio, bonus tradability, pricing, platform name, phase dates/metrics), then trading-engine and infrastructure items.
- Once docs are reviewed and approved, move out of PLANNING: build the real platform fresh (not from `Test_Terminal/`, which was a disposable spike) — database, multi-tenant setup, then real trade logic per `TRADING_ENGINE.md` and `PHASES.md`'s ordering.
