# Admin (Client / Broker): Complete Spec

A broker company that bought the platform. Manages only its own traders.

## Where
- `<subdomain>.<platform-domain>/admin`
- Subdomain chosen by the client in the application form on `trade.growwezy.com`.

## How an Admin account is created
1. Company applies on `trade.growwezy.com` (company details, documents, logo, preferred subdomain).
2. Super Admin approves.
3. System creates automatically: tenant, subdomain, main Admin login, branding (logo + name from the application). Login is emailed.

## Admin vs Sub-admin
- **Main Admin:** full access to its tenant. Creates sub-admins.
- **Sub-admin:** created by the main Admin with chosen credentials; can use **only the pages and actions granted** (e.g. Doc Reviewer, Cash Reviewer).
- **OTP:** the main Admin decides whether OTP is required for **its own** login (toggle). The toggle applies to the main Admin only.

## Flow
1. Logs in.
2. Pays setup / monthly fee to Growwezy and uploads proof on My Subscription.
3. Sets up: payment methods, symbols (from Super Admin's master list), groups and markups, trader KYC form, referral and copy-trading settings.
4. Shares subdomain with traders.
5. Daily: approves KYC, deposits, withdrawals; monitors orders and users.
6. Creates sub-admins as needed.

## Rules
- Sees and manages **only its own tenant's** traders and data.
- **Manual balance adjustment:** allowed; **every adjustment is logged** with who, when, amount and reason, and appears in the Activity Log.
- **Deposit approval** adds the amount to the trader's trading balance (as a transaction record).
- **Branding:** auto-filled from the application form; editable on Branding & Settings.
- **Trader KYC form:** each client edits its own form (fields) on KYC Form Builder.
- **Symbol settings:** Admin controls which symbols are enabled, leverage, lot size, trading hours (choosing from the master list).
- **Copy trading:** Admin picks which accounts are public masters.
- If the client does not pay Growwezy, Super Admin can suspend the tenant (manual).

## Pages (23)
| # | Group | Page | What it has |
| --- | --- | --- | --- |
| 1 | Auth | Admin Login | Login, OTP if enabled |
| 2 | Auth | Forgot / Reset Password | Reset via email |
| 3 | Overview | Dashboard | Total deposits, withdrawals, pending requests (deposit / withdraw / KYC), total and active users, open positions |
| 4 | Orders | Active Orders | All users' open positions with funds, balance, equity, margin, PnL; close or modify |
| 5 | Orders | Order History | All closed trades, filter by user, symbol, date |
| 6 | Users | User List | Total users, search, filter by KYC status and active / blocked |
| 7 | Users | User Detail | Profile, balance, equity, holdings, history, documents, referral info; block / unblock, reset password, manual balance adjustment (logged) |
| 8 | Users | KYC Requests | View submitted form and documents, approve or reject with reason |
| 9 | Funds | Deposit Requests | View payment proof, approve (credits trading balance) or reject |
| 10 | Funds | Withdrawal Requests | Approve or reject, mark as paid |
| 11 | Funds | Transactions Report | Total deposit and withdrawal data, filters, export |
| 12 | Config | Payment Methods | Bank details and USDT BEP20 / TRC20 addresses shown to traders |
| 13 | Config | Symbol Settings | Enable / disable symbols, leverage, lot size, trading hours |
| 14 | Config | Groups & Markups | User groups, spread markup per group or symbol |
| 15 | Config | Bonus | Bonus rules and manual bonus to a user |
| 16 | Config | Copy Trading | Choose which accounts can be followed, view followers |
| 17 | Config | Referral Settings | Referral commission rules (configurable) |
| 18 | Config | KYC Form Builder | Add, edit, remove trader KYC form fields; publish |
| 19 | Config | Sub-Admins & Permissions | Create sub-admin logins; tick allowed pages and actions |
| 20 | Account | Branding & Settings | Logo, colours, platform name, OTP on / off |
| 21 | Account | My Subscription | Plan, amount due, Growwezy payment details, upload payment proof, payment history |
| 22 | Account | Notifications / Announcements | Send messages to all users or a group |
| 23 | Account | Activity Log | Balance adjustments and sub-admin actions (who, what, when) |

## Interactions with other roles
- **Super Admin:** approves the client, verifies its payments, can suspend it, sees its data (view only). Does not log into this admin panel.
- **Traders:** Admin verifies their KYC, deposits, withdrawals; can block them and adjust balances.

## Not in this phase
Leads, Liquidity / LP logs, A-Book / B-Book split, detailed trading logs, PAMM, custom domains, online payment gateway.

## Open for this role
- Exact bonus rules (tradable only or withdrawable).
- Referral commission calculation and levels.
- Copy trading amount / ratio rule.
- Default KYC form fields a new client starts with.
