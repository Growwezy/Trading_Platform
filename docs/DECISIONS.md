# Decisions

One line per decision, newest first. Format: date · decision · reason (if any).

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
