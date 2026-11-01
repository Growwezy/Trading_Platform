# Decisions

One line per decision, newest first. Format: date · decision · reason (if any).

- 2026-11-01 · Production: backend, Postgres and Redis each run in their own separate Docker container, never combined into one · an app crash or redeploy must never be able to take the database or Redis down with it; separate containers tune/restart/back up independently and keep the database's files out of the app's filesystem; docker-compose makes multiple containers no harder to run than one
- 2026-10-31 · Backend runs in Docker in every environment; database is NeonDB while building, Postgres-in-Docker on AWS in production · Neon keeps dev data shared and persistent across both developers' machines; AWS deployment is self-hosted Docker, not RDS. `DATABASE_URL` is the only thing that changes between the two.
- 2026-10-28 · Auth: server-side sessions in Redis (httpOnly cookie), not JWT · instant revocation for blocking traders / suspending clients / permission changes; no native mobile app this phase; safer than a token in localStorage
- 2026-10-28 · OTP not required on login by default, for any role; used for sign-up email verification and forgot-password resets instead · Admin's own login OTP toggle and Super Admin's always-on login OTP still apply on top of this
- 2026-10-28 · Files: Cloudinary during development/testing, S3 in production · behind one small interface so the switch touches one module
- 2026-10-28 · Hosting: AWS confirmed; Twelve Data: free plan while developing, paid plan before production · EC2 vs ECS and the specific paid plan still open
- 2026-10-28 · Use OpenAlgo Charts instead of TradingView Advanced Charts, for now · validated with a working terminal + API test (`Test_Terminal/`, local only, not pushed); open-source, no waiting on TradingView access
- 2026-10-28 · Use the `openalgo-charts` npm package for the trading terminal's charts · covers charts, indicators, drawing tools and order/position lines on top of our own data feed and trading engine; Apache-2.0, no runtime dependencies
- 2026-10-27 · Build as a web app; native mobile apps later · faster to ship, one codebase
- 2026-10-27 · Each client gets a subdomain via wildcard DNS; client picks it in the application form · no manual setup per client
- 2026-10-27 · Super Admin edits the client application form; each Admin edits its own trader KYC form
- 2026-10-27 · All payments verified manually at both levels (Super Admin → clients, Admin → traders)
- 2026-10-27 · Deposits go straight to trading balance; no separate wallet for now
- 2026-10-27 · Traders view charts only until KYC is approved
- 2026-10-27 · Open sign-up; trader without referral code belongs to that subdomain's client; referral code fixed once set
- 2026-10-27 · Copy trading: follow referrer or admin-listed accounts; no master profit share for now
- 2026-10-27 · Admin may adjust balances manually; every adjustment logged
- 2026-10-27 · OTP toggle for main Admin only; always on for Super Admin
- 2026-10-27 · Super Admin sees all clients' data (view only); no login-as-client for now; manual suspension
- 2026-10-27 · Out of scope this phase: Leads, Liquidity / LP, A-Book / B-Book, detailed logs, PAMM, demo account, online payments, custom domains
- Earlier · No script / strategy editor (client request)
- Earlier · Legal and compliance handled by Growwezy
