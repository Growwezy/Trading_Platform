# Scope: Index

Total: **56 pages**. Full details for each role live in `docs/roles/`. This file is only the index; do not duplicate role details here.

| Role | File | Pages |
| --- | --- | --- |
| Trader (user) | [roles/TRADER.md](roles/TRADER.md) | 16 |
| Admin (client / broker) + sub-admins | [roles/ADMIN.md](roles/ADMIN.md) | 23 |
| Super Admin (Growwezy) + master website | [roles/SUPERADMIN.md](roles/SUPERADMIN.md) | 17 |

## Hierarchy
Super Admin (Growwezy) → Admin (client / broker) → Sub-admin (optional) → Trader

## Client onboarding (end to end)
1. Company applies on `trade.growwezy.com`.
2. Super Admin approves → tenant, subdomain, admin login and branding created automatically.
3. Client pays fee, uploads proof → Super Admin verifies.
4. Client configures payments, symbols, markups, KYC form.
5. Client shares subdomain → traders sign up, do KYC, deposit, trade.

## Payments at both levels (all manual)
- Client → Growwezy: proof on My Subscription, verified by Super Admin on Billing.
- Trader → Client: proof on Deposit, verified by Admin on Deposit Requests.

## Not in this phase
Demo account · separate wallet · master profit share · PAMM · Leads · Liquidity / LP logs · A-Book / B-Book split · detailed trading logs · Super Admin login-as-client · online payments · auto-suspend · custom client domains · Android / iOS apps · script editor.
