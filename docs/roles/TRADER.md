# Trader (User): Complete Spec

The end user who trades. Belongs to exactly one client (broker).

## Where
- `<subdomain>.<platform-domain>` (the client's subdomain)
- Sees the client's branding (logo, name, colours), loaded per tenant.

## Belongs to which client
- Signs up on a client's subdomain → belongs to that client.
- With a referral code / referral link → linked to the referrer too (inside the same client).
- Without a referral code → still belongs to the subdomain's client.

## Account states
| State | Can do | Cannot do |
| --- | --- | --- |
| Signed up, KYC not submitted | Login, view charts and markets, fill KYC, add referral code, settings | Buy / sell, deposit, withdraw, copy trade |
| KYC submitted, pending | Same as above, see KYC status in Requests | Same as above |
| KYC rejected | See reason, resubmit KYC | Same as above |
| KYC approved | Everything below | – |
| Blocked by Admin | Nothing (login blocked) | – |

## Flow
1. Opens the client's subdomain and signs up. Referral code optional (auto-filled from a referral link).
2. Before KYC approval: charts and markets are view-only.
3. Fills the KYC form (fields set by the client Admin) in the profile section and uploads documents.
4. Client Admin approves or rejects (with reason).
5. Deposits: sees the client's bank / USDT (BEP20 / TRC20) details, pays outside the platform, uploads proof + amount.
6. Admin approves → amount added to the **trading balance**.
7. Trades, withdraws, copy trades and refers.

## Rules
- **Balance:** one trading balance. No separate wallet for now.
- **Deposit:** manual; Admin verifies proof.
- **Withdraw:** request → Admin approves or rejects → Admin marks paid.
- **Referral code:** can be added at sign-up or later in KYC / Documents; **cannot be changed once set**.
- **Referral earnings:** credited to the trading balance automatically (calculation rule still open).
- **Copy trading:** can follow (a) the user who referred them, or (b) accounts the Admin made public. Can stop anytime. No profit share to the master for now. How the follower sets amount / ratio is still open.
- **Symbols:** sees only symbols the client enabled, with the client's markup applied.
- **Balance changes** made by Admin appear in the trader's history (every change is a logged transaction).

## Pages (16)
| # | Group | Page | What it has |
| --- | --- | --- | --- |
| 1 | Auth | Login | Email and password |
| 2 | Auth | Sign Up | Account creation, optional referral code |
| 3 | Auth | Forgot / Reset Password | Reset via email |
| 4 | Trading | Trading Terminal | Live chart, watchlist (added symbols), buy / sell with SL / TP, quick tabs for open positions and orders. Buy / sell disabled before KYC approval |
| 5 | Trading | Markets | All enabled symbols (Forex, Crypto, Commodities), search, add to watchlist |
| 6 | Trading | Holdings | Current open positions, live PnL, close or modify SL / TP |
| 7 | Trading | History | All closed trades (previous holdings), filters by date and symbol |
| 8 | Profile | Dashboard | Balance, equity, PnL, analytics |
| 9 | Profile | Deposit | Client's payment details (bank, USDT BEP20 / TRC20), amount, upload proof |
| 10 | Profile | Withdraw | Amount and method, request to Admin |
| 11 | Profile | Requests | Status of deposit, withdrawal and KYC requests (pending / approved / rejected + reason) |
| 12 | Profile | KYC / Documents | KYC form and document upload; add referral code if not added |
| 13 | Profile | Copy Trading | List of followable accounts (referrer + admin-listed), follow / stop, performance |
| 14 | Profile | Refer & Earn | Referral link and code, referred users, earnings |
| 15 | Profile | Notification Center | Deposit / withdrawal / KYC updates, trade alerts, announcements from Admin |
| 16 | Profile | Settings | Profile details, change password, OTP |

## Interactions with other roles
- **Admin** approves KYC, deposits, withdrawals; can block the trader; can adjust balance (logged); sends announcements; decides which accounts are followable.
- **Super Admin** can view the trader's data (view only).

## Not in this phase
Demo account, separate wallet, PAMM, master profit share, mobile apps.

## Open for this role
- Referral commission calculation and levels.
- Copy trading amount / ratio rule.
- Trading engine details: order types, leverage, margin call / stop-out, lot sizes, account currency, swaps.
