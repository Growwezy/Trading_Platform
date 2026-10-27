# Scope: Roles, Flows and Pages

Total: **56 pages**. Trader 16 · Admin (client) 23 · Super Admin + master website 17.

---

## 1. Client onboarding flow
1. Company fills the client application form on `trade.growwezy.com` (company details, documents, logo, preferred subdomain).
2. Super Admin reviews and approves or rejects.
3. On approval: subdomain, admin login and branding are created automatically; login is emailed.
4. Client pays setup / monthly fee and uploads proof on "My Subscription". Super Admin verifies on "Billing".
5. Client sets payment methods, symbols, markups and its trader KYC form.
6. Client shares its subdomain with traders.
7. Non-paying client: Super Admin suspends manually.

---

## 2. Trader (16 pages)

### Flow
1. Signs up on the client's subdomain. Referral code optional (auto-filled from a referral link).
2. Before KYC approval: charts and markets are view-only. Buy / sell and deposit disabled.
3. Fills the KYC form in the profile section and uploads documents.
4. Client Admin approves the KYC.
5. Deposits by bank or USDT, uploads proof. On approval the amount goes to the trading balance.
6. Can now trade, withdraw, copy trade and refer.

### Rules
- Referral code cannot be changed once added.
- Referral earnings credited to the trading balance automatically.
- Copy trading: follow your referrer or admin-listed accounts. No master profit share for now.
- No separate wallet.

### Pages
| # | Group | Page | What it has |
| --- | --- | --- | --- |
| 1 | Auth | Login | Email and password |
| 2 | Auth | Sign Up | Account creation, optional referral code |
| 3 | Auth | Forgot / Reset Password | Reset via email |
| 4 | Trading | Trading Terminal | Live chart, watchlist, buy / sell with SL / TP, quick view of open positions |
| 5 | Trading | Markets | All symbols (Forex, Crypto, Commodities), search, add to watchlist |
| 6 | Trading | Holdings | Open positions with live PnL, close or modify |
| 7 | Trading | History | All closed trades with filters |
| 8 | Profile | Dashboard | Balance, equity, PnL, analytics |
| 9 | Profile | Deposit | Payment details (bank, USDT BEP20 / TRC20), upload proof |
| 10 | Profile | Withdraw | Withdrawal request to admin |
| 11 | Profile | Requests | Status of deposit, withdrawal and KYC requests |
| 12 | Profile | KYC / Documents | KYC form, document upload, add referral code |
| 13 | Profile | Copy Trading | Follow referrer or admin-listed accounts, stop anytime |
| 14 | Profile | Refer & Earn | Referral link and code, referred users, earnings |
| 15 | Profile | Notification Center | Deposit approved, KYC status, trade alerts, announcements |
| 16 | Profile | Settings | Profile, password, OTP |

Later: Demo account.

---

## 3. Admin, client / broker (23 pages)
Lives at `<subdomain>.<platform-domain>/admin`. Sees only its own traders.

### Flow
1. Logs in with credentials sent after approval (OTP if the Admin turned it on).
2. Sets payment methods, symbols, markups and the trader KYC form.
3. Approves or rejects trader KYC.
4. Approves deposits (adds to trading balance) and withdrawals.
5. Monitors active orders, history, balances.
6. Creates sub-admins with chosen page / action permissions.

### Rules
- Manual balance adjustment allowed; always logged with reason, who and when.
- Branding auto-filled from the application form; editable.
- Each client edits its own trader KYC form.
- OTP toggle applies to the main Admin login only.

### Pages
| # | Group | Page | What it has |
| --- | --- | --- | --- |
| 1 | Auth | Admin Login | Login, OTP if enabled |
| 2 | Auth | Forgot / Reset Password | Reset via email |
| 3 | Overview | Dashboard | Deposits, withdrawals, pending requests, users, open positions |
| 4 | Orders | Active Orders | All users' open positions with funds, balance, equity, margin, PnL |
| 5 | Orders | Order History | All closed trades with filters |
| 6 | Users | User List | All users, search, filter by KYC status and active / blocked |
| 7 | Users | User Detail | Profile, balance, holdings, history, documents, block / unblock, manual balance adjustment |
| 8 | Users | KYC Requests | View form and documents, approve or reject with reason |
| 9 | Funds | Deposit Requests | View payment proof, approve or reject |
| 10 | Funds | Withdrawal Requests | Approve or reject, mark as paid |
| 11 | Funds | Transactions Report | Total deposit and withdrawal data, filters, export |
| 12 | Config | Payment Methods | Bank details and USDT addresses shown to traders |
| 13 | Config | Symbol Settings | Enable / disable symbols, leverage, lot size, trading hours |
| 14 | Config | Groups & Markups | User groups, spread markup per group or symbol |
| 15 | Config | Bonus | Bonus rules and manual bonus |
| 16 | Config | Copy Trading | Choose which accounts can be followed, view followers |
| 17 | Config | Referral Settings | Referral commission rules |
| 18 | Config | KYC Form Builder | Add, edit, remove trader KYC form fields; publish |
| 19 | Config | Sub-Admins & Permissions | Create sub-admin logins, choose allowed pages and actions |
| 20 | Account | Branding & Settings | Logo, colours, platform name, OTP on / off |
| 21 | Account | My Subscription | Plan, amount due, Growwezy payment details, upload proof, payment history |
| 22 | Account | Notifications / Announcements | Send messages to all users or a group |
| 23 | Account | Activity Log | Balance adjustments and sub-admin actions |

---

## 4. Super Admin + master website (17 pages)

### Flow
1. New application arrives from the master website.
2. Super Admin approves or rejects. Approval sets up the client automatically.
3. Verifies client payments on Billing.
4. Monitors all clients, traders, orders and transactions (view only).
5. Suspends or activates clients manually.

### Pages
| # | Group | Page | What it has |
| --- | --- | --- | --- |
| 1 | Master website | Landing Page | About the platform, "Become a Client" button |
| 2 | Master website | Client Application Form | Company details, documents, logo, preferred subdomain |
| 3 | Master website | Application Submitted | Confirmation and review status |
| 4 | Auth | Super Admin Login | Login with OTP |
| 5 | Auth | Forgot / Reset Password | Reset via email |
| 6 | Clients | Dashboard | Total clients, pending applications, total traders, deposits and withdrawals across all clients |
| 7 | Clients | Client Applications | Review, approve or reject; approval creates subdomain and admin login |
| 8 | Clients | Client List | All clients, active or suspended, search |
| 9 | Clients | Client Detail | Company info, subdomain, admin details, stats, suspend / activate, reset admin password |
| 10 | Monitoring | All Traders | Every client's traders, filter by client (view only) |
| 11 | Monitoring | All Orders & Transactions | Trades, deposits and withdrawals across clients (view only) |
| 12 | Settings | Application Form Builder | Edit client application form fields, publish |
| 13 | Settings | Master Symbol List | Symbols available on the platform; clients choose from this list |
| 14 | Settings | Billing / Subscriptions | Setup and monthly fee per client, verify payment proof, paid / due status |
| 15 | Settings | Staff & Permissions | Growwezy team logins with limited access |
| 16 | Settings | Announcements to Clients | Message to all or selected clients |
| 17 | Settings | Activity Log | Approvals, suspensions, form changes, payment verifications |

---

## 5. Not in this phase
Demo account · separate wallet · master profit share · PAMM · Leads · Liquidity / LP logs · A-Book / B-Book split · detailed trading logs · Super Admin login-as-client · online payments · auto-suspend · custom client domains · Android / iOS apps · script editor.

## 6. To be finalised
- Referral commission: basis and number of levels.
- Copy trading: how the follower sets amount or ratio.
