# Super Admin (Growwezy): Complete Spec

The platform owner. Onboards clients (brokers), verifies their payments and can see all data.

## Where
- Master website (public): `trade.growwezy.com`
- Super Admin panel: on the master site (exact path to be set in ARCHITECTURE.md)

## Super Admin staff
- Growwezy can create team logins with limited access (Staff & Permissions).
- **OTP is always on** for Super Admin login.

## Flow
1. A company submits the client application form on the master website.
2. Super Admin reviews details and documents, approves or rejects.
3. On approval the system automatically creates: tenant, subdomain (as chosen in the form), main Admin login, branding (logo + name from the form), and emails the login.
4. Client pays setup / monthly fee and uploads proof; Super Admin verifies it on Billing.
5. Super Admin monitors all clients, their traders, orders and transactions (view only).
6. Non-paying client: Super Admin suspends it **manually** (and can re-activate).

## Rules
- **Sees all clients' data**, view only.
- **No login into a client's admin panel** (for now).
- **Suspension is manual**; no auto-suspend.
- **Billing is manual verification** of uploaded proof; no online payments.
- Edits the **client application form** (fields) and publishes it.
- Maintains the **master symbol list**; clients choose their symbols from it.
- Subdomain is chosen by the client in the form; reserved names (`admin`, `api`, `www`, `trade`, `mail`) are blocked.

## Pages (17)
| # | Group | Page | What it has |
| --- | --- | --- | --- |
| 1 | Master website | Landing Page | About the platform, features, "Become a Client" button |
| 2 | Master website | Client Application Form | Company details, contact, documents, logo, preferred subdomain |
| 3 | Master website | Application Submitted / Status | "Under review" message, email confirmation |
| 4 | Auth | Super Admin Login | Login with OTP (always on) |
| 5 | Auth | Forgot / Reset Password | Reset via email |
| 6 | Clients | Dashboard | Total clients, pending applications, total traders across all clients, total deposits / withdrawals across all clients |
| 7 | Clients | Client Applications | Review details and documents, approve or reject; approve triggers automatic client setup |
| 8 | Clients | Client List | All clients, status (active / suspended), search |
| 9 | Clients | Client Detail | Company info, subdomain, admin details, stats (traders, deposits, PnL); suspend / activate, reset admin password |
| 10 | Monitoring | All Traders | Every client's traders, filter by client (view only) |
| 11 | Monitoring | All Orders & Transactions | Trades, deposits, withdrawals across clients (view only) |
| 12 | Settings | Application Form Builder | Add, edit, remove client application form fields; publish |
| 13 | Settings | Master Symbol List | Symbols available on the platform (from the data feeds) |
| 14 | Settings | Billing / Subscriptions | Setup and monthly fee per client, verify uploaded payment proof, paid / due status |
| 15 | Settings | Staff & Permissions | Growwezy team members with limited access |
| 16 | Settings | Announcements to Clients | Message to all or selected client admins |
| 17 | Settings | Activity Log | Client approvals, suspensions, form changes, payment verifications |

## Interactions with other roles
- **Admins (clients):** approves them, verifies their payments, suspends / activates them, sends announcements, resets their admin password.
- **Traders:** view only.

## Not in this phase
Login as client admin, auto-suspend, online payments, custom client domains.

## Open for this role
- Pricing plans (2–3 plans; platform's trading account vs client's own; configurable spread). Upfront + monthly fee; plan details not finalised.
- Referral model for selling to brokers.
- Exact URL path of the Super Admin panel.
