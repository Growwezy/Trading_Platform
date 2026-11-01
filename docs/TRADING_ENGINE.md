# Trading Engine

How a trade actually works: the concepts explained plainly first, then the formulas and rules. Lives in the `trading` module from `ARCHITECTURE.md` §5, and always acts on the per-tenant adjusted price from `ARCHITECTURE.md` §6 — never the raw feed price. Proposed items are marked **(proposed)**; genuinely open ones are listed at the end.

## 0. What kind of broker this is

We are not routing trades to a real exchange. Binance and Twelve Data are **read-only price sources** — we use them only to know what the market price is. Every trade a trader places is a bet against the broker's own books: if the trader makes money, it comes out of that tenant's balance sheet; if the trader loses, it stays there. This is sometimes called a "dealing desk" or "B-Book" model. It's why `A-Book / B-Book split` and `Liquidity / LP logs` are explicitly out of scope (`CLAUDE.md`) — there's no real order to route anywhere. Trading, at the engine level, is bookkeeping: move numbers between a trader's balance and nowhere else, correctly and with a paper trail.

## 1. Core concepts, plainly

- **Lot**: a standard trade size. For forex, 1 lot = 100,000 units of the base currency (e.g. 1 lot of EUR/USD = €100,000). For crypto/stocks here, 1 lot = 1 unit (1 lot of BTC = 1 BTC) — the MT4/MT5-style convention already used in the terminal test.
- **Contract size**: how many units one lot represents. 100,000 for forex. 1 for crypto/stocks. Commodities vary by instrument (e.g. gold is often quoted per 100 troy ounces) and must be set explicitly per symbol — see §4.
- **Leverage**: how much exposure $1 of margin controls. 50x leverage means $1 held controls $50 of position. Higher leverage = less margin required for the same trade, and bigger swings in the account from the same price move.
- **Margin**: the money "locked" from the trading balance to open and hold a position. Not lost — released back when the position closes.
- **Notional value**: the full size of the trade in money terms (`units × price`), regardless of leverage.
- **Equity**: balance plus every open position's current (unrealized) profit or loss. What the account is "really worth" right now.
- **Free margin**: equity minus margin in use. What's left to open new trades.
- **Margin level**: `equity ÷ margin × 100`. The health-check number — see §9.
- **Floating / unrealized PnL**: profit or loss on a position that's still open — changes every tick.
- **Realized PnL**: profit or loss that's locked in because the position closed. This is what actually changes the balance.

### Worked example
Trader has a $1,000 balance, no open positions. Equity = $1,000, free margin = $1,000.

They buy 0.1 lots of BTC (contract size 1, so 0.1 BTC) at $60,000, with 10x leverage.
- Notional = 0.1 × $60,000 = $6,000
- Margin required = $6,000 ÷ 10 = $600
- Balance stays $1,000 (nothing is spent yet); margin in use = $600; free margin = $1,000 − $600 = $400; equity is still $1,000 (no PnL yet).

Price rises to $61,000. Unrealized PnL = (61,000 − 60,000) × 0.1 = **+$100**. Equity = $1,000 + $100 = $1,100. Margin level = 1,100 ÷ 600 × 100 = **183%**.

They close the position at $61,000. Realized PnL = +$100, written as a transaction. Balance becomes $1,100. Margin in use returns to $0.

## 2. Position model: one ticket per trade **(decided 2026-11-01)**

Each trade a trader opens is its own position — its own entry price, size, leverage, SL/TP and margin — not merged into one net position per symbol. A trader can hold several open positions on the same symbol at once (even opposite directions), and closes or modifies each individually.

This follows from how the pages are described: Holdings lists "current open positions" (plural) with "close or modify SL/TP" per row, and Admin's Active Orders is the same, per-position. It also matches what the terminal test already built. Flagged as proposed only because it's a real design choice (the alternative — one combined position per symbol, like `openalgo-charts`' own trade tier assumes — would mean fewer, simpler position rows but no per-trade SL/TP). Confirm this matches what you actually want traders to see.

## 3. Order types this phase **(proposed)**

**Market orders only**, with optional Stop Loss and Take Profit attached at open, both editable afterward. No pending Limit or Stop (entry) orders yet — the trader pages describe "buy/sell with SL/TP," not an order book of pending entries. Flagged because it's a real scope cut: pending orders are a materially bigger feature (they need to sit and wait for a price, get checked every tick like SL/TP does, and can be cancelled before they fill). Add them in a later phase if needed.

## 4. Symbol configuration

Each symbol carries, set once in the Super Admin's master symbol list and then adjusted per tenant in Admin's Symbol Settings:
- **Contract size** — units per 1.0 lot (§1). Must be entered correctly per instrument; there's no safe default for commodities.
- **Leverage** — the maximum leverage allowed on that symbol for that tenant. **(proposed)** the trader can choose any leverage up to this maximum at order time (defaulting to the maximum), rather than one fixed value for everyone — simpler to change your mind per trade, same as the terminal test. Confirm whether a fixed single leverage per symbol is actually wanted instead.
- **Trading hours** — new orders outside these hours are rejected. Existing SL/TP still trigger on whatever ticks arrive (there usually aren't any outside hours, which is the point).
- **Base spread** — see §5.
- **Minimum lot size** and a sensible maximum, to block a typo like "100 lots" by accident. **(proposed)** — no document has set actual numbers yet; needs real values before launch.

## 5. The price a trade actually uses

Binance and Twelve Data's free/basic tiers typically give a **last traded price**, not a live bid and ask. So the engine builds its own:

1. `rawPrice` comes in from the feed (§`ARCHITECTURE.md` §6).
2. The symbol's **base spread** (in price points, set per symbol) creates a synthetic bid/ask around it: `bid = rawPrice − spread/2`, `ask = rawPrice + spread/2`.
3. The tenant's **markup** (Admin's Groups & Markups page) widens that further, same idea, on top.
4. Result: **tenant-adjusted bid and ask** — this is the one and only price the trading engine ever uses.

A **buy** opens at the ask and closes at the bid. A **sell** opens at the bid and closes at the ask. That gap is the cost of the spread — a position opened and immediately closed at the same `rawPrice` shows a small loss, which is expected and is how the spread/markup actually becomes revenue, not a bug to "fix."

## 6. Margin and sizing formulas

```
units          = lots × contractSize
notionalValue  = units × entryPrice
requiredMargin = notionalValue / leverage
```

An order is rejected if `requiredMargin > account.freeMargin`, with a clear message stating both numbers (as the terminal test already does) — never a silent partial fill.

## 7. Profit/loss and account health formulas

```
unrealizedPnl   = (currentPrice − entryPrice) × units      // buy
unrealizedPnl   = (entryPrice − currentPrice) × units      // sell

totalFloatingPnl = sum of unrealizedPnl across all open positions
equity           = balance + totalFloatingPnl
freeMargin       = equity − totalMarginInUse
marginLevel      = totalMarginInUse > 0 ? (equity / totalMarginInUse × 100) : null
```

Recomputed on every price tick for every position on that symbol, and on every open/close/adjustment — never read from a stale cached value.

## 8. Stop Loss / Take Profit

- Validated at order time: a Buy's SL must be below entry and TP above; a Sell's SL must be above entry and TP below. Reject otherwise, with the reason.
- Checked on every tick, using the same tenant-adjusted price from §5 that would be used to close manually — the display price, the SL/TP trigger price, and the fill price must always be the same number, or a trader could legitimately ask "why did it close at a different price than I saw?"
- A trigger closes the position through the exact same path as a manual close (§11) — same balance update, same transaction record. There is no separate "automatic" shortcut that skips the paper trail.
- **Gaps**: if the market jumps past an SL/TP level between ticks (common over a weekend open), the position fills at the first price received past that level, not exactly at the SL/TP price. This is normal and matches real brokers — no special handling needed, just don't assume the fill price always equals the stop price.

## 9. Margin call and stop-out **(proposed thresholds)**

Two safety nets, both driven by margin level (§7):
- **Margin call** at **100%**: a warning shown to the trader (and usually a notification) that they're close to being forced out. No action is taken automatically.
- **Stop-out** at **50%**: the system force-closes positions to bring the account back to safety, starting with the position currently showing the biggest loss, rechecking margin level after each close, and stopping as soon as it's back above the stop-out line (or everything is closed).

These numbers are the common MT4/MT5 defaults, not something decided for this project — proposed here so there's a working rule to build against. They should end up configurable per tenant (different brokers run different risk policies), which just means they live as settings on the tenant, not constants in code.

## 10. Closing a position

Full close only **(proposed)** — no partial close (closing half a position) this phase; the pages describe "close" as a single action per position row, not a size input. Add partial close later if wanted; it mainly means the position's size and margin shrink instead of the row disappearing, with the realized portion still written as its own transaction.

```
realizedPnl = (closePrice − entryPrice) × units      // buy
realizedPnl = (entryPrice − closePrice) × units       // sell

balance += realizedPnl
marginInUse -= position.requiredMargin
```

One database transaction: write the new balance, write the transaction row, move the position from open to closed history. All three or none — this is the engineering rule from `CLAUDE.md` applied concretely.

## 11. Where this module's boundary is

Everything else that touches a balance — manual adjustments, bonuses, deposits, withdrawals, referral payouts — goes through the same "balance change + transaction row, one DB transaction" rule, but those are owned by the funds/referrals modules (`ARCHITECTURE.md` §5), not this one. The trading engine's job is specifically: validate an order, hold margin, track PnL, trigger SL/TP, and close a position correctly. A few things worth naming so the boundary is clear:

- **Manual adjustment / bonus**: changes `balance` directly through the funds module. The trading engine just reads whatever `balance` currently is when it next recalculates equity — it doesn't need to know *why* the balance changed. Whether a bonus counts fully toward equity (if it's "tradable") is a funds-module decision, already flagged open in `docs/roles/ADMIN.md`.
- **Referral earnings**: credited to balance by the referrals module, same transaction rule. The formula/levels are still an open question (`PROJECT_CONTEXT.md` §9) — not something this doc resolves.
- **Copy trading**: when a followed account opens or closes a trade, the system places (or closes) an equivalent order into each follower's account through this same engine's normal `placeOrder`/`closePosition` path — a copied trade is not a different kind of trade internally. How a follower's size is derived from the master's (fixed amount vs. ratio) is still open (`PROJECT_CONTEXT.md` §9); once decided, it's just an input to the same formulas in §6.

## 12. Internal interface (sketch)

```ts
placeOrder(tenantId, traderId, { symbol, side, lots, leverage, stopLoss?, takeProfit? }): Position
closePosition(tenantId, positionId, reason: 'manual' | 'stop_loss' | 'take_profit' | 'stop_out'): ClosedPosition
modifyStopLossTakeProfit(tenantId, positionId, { stopLoss?, takeProfit? }): Position
onPriceTick(tenantId, symbol, adjustedBid, adjustedAsk): void   // recalculates PnL, checks SL/TP and stop-out for every account with an open position on that symbol
getAccountSnapshot(tenantId, traderId): { balance, equity, margin, freeMargin, marginLevel, openPositions }
```

Mirrors the shape already proven in the terminal test's `trade-engine.js`, with three real differences: persisted in Postgres instead of in memory, scoped by `tenantId` everywhere, and every write goes through the transaction rule in §10 instead of just mutating an object.

## 13. Decided (2026-11-01) — standard retail-broker defaults, all configurable per tenant later

All seven items below were open questions; resolved to standard values so building isn't blocked. None of these are hardcoded constants — they're tenant/symbol-level settings an Admin can change from their panel. See `DECISIONS.md`.

1. **Leverage model**: trader picks up to a per-symbol maximum (as proposed in §4) — not one fixed leverage per symbol.
2. **Margin call / stop-out thresholds** (§9): **100% / 50%**, the MT4/MT5 default. Configurable per tenant (stored on the tenant, not a global constant). **Pending final confirmation from the client** — message sent 2026-11-01 asking whether these defaults are acceptable, along with per-asset-class max leverage. Update here once they reply.
3. **Order types** (§3): market orders only this phase. No pending Limit/Stop orders.
4. **Partial close** (§10): full-close-only this phase.
5. **Account currency**: single currency (USD) for every tenant's balances. No multi-currency/FX conversion.
6. **Swaps** (overnight financing): out of scope this phase.
7. **Minimum/maximum lot size per symbol** (§4): default **0.01 min / 10 max** per symbol (already what `backend/prisma/seed.ts` uses), adjustable per tenant per symbol. Default max leverage per asset class pending the same client reply as item 2 — using **100x Forex / 20x Crypto / 50x Commodities** in the meantime (also already in the seed data).
