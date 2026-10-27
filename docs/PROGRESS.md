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

## In progress
- Planning docs still to write: DATABASE_SCHEMA, API_SPEC, TRADING_ENGINE, ROLES_PERMISSIONS, PHASES, GLOSSARY, OPEN_QUESTIONS.

## Next
- Review and approve `ARCHITECTURE.md`, especially its proposed items (monorepo/3-apps, one backend service, managed Postgres/Redis).
- Decide the remaining open items in `TECH_STACK.md` (EC2 vs ECS, Twelve Data production plan, Node version).
- Build the real platform fresh (not from `Test_Terminal/`, which was a disposable spike): database, multi-tenant setup, then real trade logic (orders, SL / TP, PnL) per `TRADING_ENGINE.md` once written.
