# Glossary

Plain-language definitions, for a 2-person team where neither developer is a trading expert (per `CLAUDE.md`). Trading terms are explained in more depth, with the worked example, in `TRADING_ENGINE.md` §1 — this is the quick-reference version.

## Trading terms

| Term | Meaning |
| --- | --- |
| **Lot** | A standard trade size. 1 lot of forex = 100,000 units of the base currency; 1 lot of crypto here = 1 coin. |
| **Contract size** | How many units one lot represents for a given symbol (100,000 for forex, 1 for crypto, instrument-specific for commodities). |
| **Leverage** | How much position size $1 of margin controls, e.g. 10x leverage turns $600 of margin into $6,000 of exposure. |
| **Margin** | The portion of the trading balance "locked" to open and hold a position. Released back when the position closes. |
| **Notional value** | The full size of a trade in money terms (`units × price`), ignoring leverage. |
| **Balance** | The trader's confirmed money — what it would be if every open position were closed right now at its last known PnL, minus that PnL. Only changes through a transaction (deposit, withdrawal, realized trade close, adjustment). |
| **Equity** | Balance plus every open position's current (unrealized) profit or loss — what the account is worth *right now*, including trades still running. |
| **Free margin** | Equity minus margin currently in use — what's available to open new trades. |
| **Margin level** | `equity ÷ margin in use × 100`. The account's health-check percentage; see Margin call / Stop-out below. |
| **Floating / unrealized PnL** | Profit or loss on a position that is still open. Changes on every price tick. |
| **Realized PnL** | Profit or loss that is locked in because the position closed. This is the number that actually changes the balance. |
| **Bid / Ask** | The two prices around the market price: a trader buys at the ask, sells at the bid. The gap between them (the spread) is built synthetically here, since free-tier feeds give only one last price (`TRADING_ENGINE.md` §5). |
| **Spread** | The gap between bid and ask, in price points. Set per symbol as a base value, then widened further by the tenant's markup. |
| **Markup** | The extra spread a client (Admin) adds on top of the base spread, per symbol or trader group — this is how a broker earns money on trading volume. |
| **Margin call** | A warning level (proposed 100% margin level) telling the trader they're close to being forced out of their positions. No action taken automatically. |
| **Stop-out** | The level (proposed 50% margin level) at which the system force-closes positions automatically to protect the account from going negative. |
| **SL / TP (Stop Loss / Take Profit)** | Prices attached to a position that automatically close it if the market reaches them — SL to limit a loss, TP to lock in a gain. |
| **Position / Ticket** | One open trade — its own entry price, size, leverage, and SL/TP. "Ticket-based" means each trade is its own row, not merged into one combined position per symbol. |
| **Dealing desk / B-Book** | The model this platform uses: the broker is the counterparty to every trade. There's no real exchange order behind a trader's buy/sell — Binance/Twelve Data are only used to know the market price. |

## Platform terms

| Term | Meaning |
| --- | --- |
| **Tenant** | One client (broker) and everything that belongs to it — its traders, symbols, markups, branding. Resolved from the subdomain in the request. |
| **Subdomain** | The `<name>.<platform-domain>` a client picks in its application form; where its traders and admin panel live. |
| **Multi-tenant** | One running system serving every client, with each client's data kept apart by `tenant_id`, rather than a separate deployment per client. |
| **Super Admin** | Growwezy's own role: approves clients, verifies their payments, views (not edits) everyone's data. |
| **Admin** | A client's own main login — runs its tenant day to day. |
| **Sub-admin** | An Admin-created login limited to whichever pages/actions the Admin ticked for it. |
| **Trader** | The end user who signs up on a client's subdomain and trades. |
| **KYC (Know Your Customer)** | The identity/verification form a trader fills in before they're allowed to deposit or trade; each client's Admin designs its own form and reviews submissions. |
| **Client application form** | The form a company fills in to become a Growwezy client; Super Admin designs this one and reviews submissions. |
| **Referral code** | A code a trader can add (once, permanently) linking them to whoever referred them, for referral earnings. |
| **Copy trading** | A trader following another account (their referrer, or an Admin-made-public account) so trades mirror automatically. |
| **Public master** | An account an Admin has marked as followable by other traders in copy trading. |
| **Transaction (ledger entry)** | A row recorded every single time a balance changes, saying how much, why, and who/what caused it. The engineering rule: no balance change ever happens without one. |
| **Activity Log** | The page showing a tenant's balance adjustments and sub-admin actions (or, for Super Admin, approvals/suspensions/form changes) — built from the same transaction/audit data. |
| **Branding** | A tenant's logo, name and colours, loaded at runtime from its application form data — never hard-coded per client. |
| **DataFeed** | The interface the chart library and the backend's market-data code both sit behind, so the chart or the price provider can be swapped without touching the other. |
| **Fan-out** | One upstream connection to Binance/Twelve Data per symbol, shared and broadcast to every tenant/user watching that symbol, instead of one connection per viewer. |
