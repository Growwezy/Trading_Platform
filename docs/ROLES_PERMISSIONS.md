# Roles & Permissions

Who can do what, in one place. The per-role flow and page lists are in `docs/roles/*.md`; this doc is the cross-cutting matrix — useful when building the permission middleware (`ARCHITECTURE.md` §3) and the Sub-Admins & Permissions page.

## The four logins

| Login | Table row | Scope | OTP on login |
| --- | --- | --- | --- |
| Trader | `users`, `role = trader` | Own account only, within one tenant | Never required by default |
| Admin (main) | `users`, `role = admin` | Everything in its own tenant | Optional toggle, its own choice |
| Sub-admin | `users`, `role = sub_admin` | Only the resources its `permissions` rows grant, within its tenant | Same as main Admin's toggle (it's the same tenant's login policy) |
| Super Admin / Staff | `users`, `role = super_admin` / `staff`, `tenant_id = null` | Every tenant, view-only except where noted below | Always required |

There is no fifth "Growwezy staff" role in the data model — `role = staff` is a Super Admin-tenant login with its own `permissions` rows, the same mechanism as a sub-admin (`docs/roles/SUPERADMIN.md` — Staff & Permissions).

## Permission model

- **Trader and Admin (main)** have a fixed set of permissions — everything their role doc lists, no per-account variation.
- **Sub-admin and Staff** have a *granted* set: a row in `permissions` per resource (`resource, can_view, can_edit`), ticked by the main Admin or Super Admin respectively. Nothing is implicit — a sub-admin with no row for a resource can't see it, full stop.
- **Checked twice:** the frontend hides what an account can't do (so the UI isn't confusing), and the backend independently rejects it in middleware even if the request is sent directly. The UI hiding something is never the actual control (`ARCHITECTURE.md` §3).
- **Tenant isolation is not a "permission"** — it's enforced underneath all of this, on every query, regardless of role or grant (`ARCHITECTURE.md` §2). A sub-admin can't be granted access to another tenant's data; the concept doesn't exist.

## Resource matrix

Rows are the same groupings `API_SPEC.md` uses. "✓" = full access for that role; "view" = read-only; "—" = no access; "grant" = available to tick on for a sub-admin/staff account.

| Resource | Trader | Admin (main) | Sub-admin | Super Admin |
| --- | --- | --- | --- | --- |
| Own profile / KYC / settings | ✓ (own only) | — | — | — |
| Trading terminal / orders (own) | ✓ (own only, after KYC approved) | — | — | — |
| Active Orders / Order History (tenant-wide) | — | ✓ | grant | view (all tenants) |
| User List / User Detail | — | ✓ | grant | view (all tenants) |
| Balance adjustment | — | ✓ (logged) | grant | — |
| KYC Requests (review) | — | ✓ | grant | — |
| Deposit / Withdrawal Requests | — | ✓ | grant | — |
| Transactions Report | — | ✓ | grant | view (all tenants) |
| Payment Methods / Symbol Settings / Groups & Markups | — | ✓ | grant | — |
| Bonus / Copy Trading config / Referral Settings | — | ✓ | grant | — |
| KYC Form Builder | — | ✓ | grant | — |
| Sub-Admins & Permissions | — | ✓ (creates/grants) | — | — |
| Branding & Settings / My Subscription | — | ✓ | grant | verifies subscription proof |
| Activity Log (own tenant) | — | ✓ | grant (view only, typically) | — |
| Client Applications (review) | — | — | — | ✓ |
| Client List / Client Detail / suspend | — | — | — | ✓ |
| All Traders / All Orders & Transactions | — | — | — | view (all tenants) |
| Application Form Builder / Master Symbol List | — | — | — | ✓ |
| Billing / Subscriptions (verify) | — | — | — | ✓ |
| Staff & Permissions | — | — | — | ✓ (creates/grants) |
| Announcements | sees (not sends) | sends (to its traders) | grant | sends (to client admins) |

"view (all tenants)" is the Super Admin's one standing exception to view-only: it can suspend/reactivate a client and reset an admin's password (`docs/roles/SUPERADMIN.md`), but it never edits a trader's data or logs into a client's admin panel (out of scope this phase).

## Account-state gating (Trader only)

A permission grant is static; a trader's own state also gates what the *same* granted actions actually allow, per `docs/roles/TRADER.md`:

| State | Charts | Deposit | Trade | Withdraw | Copy trade |
| --- | --- | --- | --- | --- | --- |
| KYC not submitted / pending / rejected | view only | — | — | — | — |
| KYC approved | ✓ | ✓ | ✓ | ✓ | ✓ |
| Blocked by Admin | — (cannot log in) | — | — | — | — |

## Open items — confirm before building

1. **Granularity of a `permissions` resource** — one row per *page* (coarse, e.g. "KYC Requests") vs one row per *action* within a page (fine, e.g. "KYC Requests: view" separate from "KYC Requests: approve"). `DATABASE_SCHEMA.md` §1 already assumes page-level with a separate `can_edit` flag; confirm that's granular enough.
2. **Default grant set for a brand-new sub-admin** — nothing ticked (safest, matches "only what's granted") vs. some sensible starter set. Recommend nothing ticked; flagging since it affects the Sub-Admins & Permissions page's first-run UI.
3. **Super Admin staff resource list** — the matrix above only covers tenant-side resources; Growwezy's own staff permission list (which Super Admin pages are grantable) hasn't been itemized yet.
