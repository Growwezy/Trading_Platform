# Project Context: Growwezy Trading Platform

Everything decided so far. Source of truth for planning. If something here conflicts with code, this file wins until a decision in `DECISIONS.md` changes it.

## 1. The project
- Multi-client (multi-tenant) trading SaaS + broker back-office, delivered as a **web app** (desktop and mobile browsers).
- Owner and first client: **Growwezy**. Growwezy sells the platform to brokers (clients); each broker onboards its own traders.
- Reference product for features: **XtremeNext** (forex / crypto broker CRM). We take its ideas, not its full scope.
- Team: **2 developers**. Neither is a trading expert.
- Payment for the job: upfront amount + commission on every sale.
- Current priority: the **trading experience** (terminal) must be as good as possible.

## 2. Roles
| Role | Who | Main jobs |
| --- | --- | --- |
| Super Admin | Growwezy | Approve client applications, verify client payments, view all clients' data, suspend clients manually, edit the client application form |
| Admin | Client / broker | Run its subdomain, verify trader KYC, approve deposits and withdrawals, set symbols / markups / KYC form, create sub-admins |
| Sub-admin | Created by an Admin | Only the pages and actions the Admin grants |
| Trader | End user | Sign up, KYC, deposit, trade, withdraw, copy trade, refer |

## 3. Domains and multi-tenancy
- Master website + Super Admin: `trade.growwezy.com`.
- Platform domain bought on **Hostinger**; DNS to be managed on **Cloudflare** (wildcard record + SSL).
- Each client: `<subdomain>.<platform-domain>` for traders, `/admin` on the same subdomain for the client admin.
- Client chooses its subdomain in the application form. On approval the subdomain, admin login and branding are created automatically.
- Tenant is resolved from the request hostname. Every tenant-owned table carries `tenant_id`.
- Reserved subdomains: `admin`, `api`, `www`, `trade`, `mail`.
- Branding (logo, name) is taken from the application form; Admin can edit it later. Loaded at runtime per tenant.

## 4. Business rules
### Client (broker) side
- Client applies on the master website; Super Admin approves or rejects.
- Client pays setup / monthly fee, uploads proof on "My Subscription"; Super Admin verifies on "Billing".
- Non-paying clients are suspended manually by Super Admin.

### Trader side
- Open sign-up on a client's subdomain; referral code optional (auto-filled from a referral link).
- A trader who signs up without a referral code belongs to that subdomain's client.
- Referral code can be added later in profile, but cannot be changed once set.
- Before KYC approval: charts and markets are view-only. No deposit, no trading.
- KYC is done in the profile section; the client Admin approves it.
- Deposit: bank or USDT (BEP20 / TRC20), trader uploads proof, Admin approves, amount goes to the **trading balance**. No separate wallet for now.
- Withdrawal: request to Admin, Admin approves and marks paid.
- Referral earnings are credited to the trading balance automatically.
- Copy trading: follow your referrer, or accounts the Admin made public. No profit share for masters for now.
- Notification center: yes.

### Admin side
- Admin can manually adjust a trader's balance; **every adjustment is logged** (who, when, amount, reason).
- Admin controls symbol settings (enable / disable, leverage, lot size, trading hours) from the Super Admin's master symbol list.
- Admin edits its own trader KYC form.
- OTP on login: optional toggle for the main Admin only.
- Activity Log page records balance adjustments and sub-admin actions.

### Super Admin side
- Sees all clients' traders, orders and transactions (view only).
- Does not log in to client admin panels (for now).
- Edits the client application form.
- OTP always on.

### Legal
- Legal and compliance are handled by Growwezy. No regulatory flows in the build.

## 5. Market data and charts
- **Binance WebSocket**: crypto, free, fast.
- **Twelve Data**: forex / crypto, **Basic plan** token in hand. A speed comparison script vs Binance has been run.
- **Charting library: OpenAlgo Charts** (open-source, Apache-2.0, `openalgo-charts` npm package), used instead of TradingView Advanced Charts for now. TradingView Advanced Charts access was applied for (Agreement PDF received, access not yet granted) but is no longer the active plan; revisit only if a real need comes up.
- Keep the chart library behind a swappable interface regardless, per the engineering rules.
- Script / strategy editor: not wanted.

## 6. What already exists (prototype)
- "Growwezy Trading Terminal" (React + Vite, dev server on `localhost:5174`).
- Live charts from Binance and Twelve Data, symbol switching.
- Shared WebSocket fan-out: one upstream connection per feed / symbol, broadcast to many clients.
- All verified working. **No database yet.**
- Next on the prototype: trade logic (orders, SL / TP, PnL) and the database.

## 7. Planned stack (to confirm in TECH_STACK.md)
- Frontend: React + Vite, Tailwind, TanStack Query, Zustand
- Backend: Node.js / Express, WebSocket server
- Database: PostgreSQL via Prisma
- Cache / real-time: Redis
- Files: Cloudinary or S3
- Hosting: AWS (EC2 / ECS); Render used before
- Mobile: web app only now; PWA or Capacitor possible later

## 8. Out of scope for this phase
Demo account · separate wallet · master profit share · PAMM · Leads · Liquidity / LP logs · A-Book / B-Book split · detailed trading logs · Super Admin login-as-client · online payments · auto-suspend · custom client domains · Android / iOS apps · script editor.

## 9. Open questions
1. Referral commission: calculated on what (deposit, trading, fixed) and how many levels?
2. Copy trading: how does a follower set the amount or ratio?
3. Trade execution model long-term (A-Book / B-Book is out of this phase).
4. Production market-data plan and monthly cost.
5. Phase dates and success metrics.
6. Final platform name.
7. Pricing plans for clients (2–3 plans: platform's account vs client's own, configurable spread). Upfront + monthly; referral model for selling to brokers not worked out.
