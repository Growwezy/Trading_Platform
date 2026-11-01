import { NavLink, Outlet } from "react-router-dom";
import { useAccountSummary, useLogout, useMe, useTenantConfig } from "@growwezy/api-client";

const navItems = [
  { to: "/", label: "Terminal" },
  { to: "/holdings", label: "Holdings" },
  { to: "/dashboard", label: "Dashboard" },
];

function fmt(value: string | null | undefined) {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function Layout() {
  const { data: me } = useMe();
  const { data: tenantData } = useTenantConfig();
  const { data: summary } = useAccountSummary();
  const logout = useLogout();
  const tenant = tenantData?.tenant;

  return (
    <div className="flex h-screen flex-col bg-app text-primary">
      <header className="flex h-11 shrink-0 items-center gap-6 border-b border-edge bg-panel px-3 text-sm">
        <div className="flex items-center gap-2 font-semibold tracking-tight">
          {tenant?.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.companyName} className="h-5 w-5 rounded" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded bg-accent text-[10px] font-bold text-app">
              {(tenant?.companyName ?? "G").charAt(0)}
            </span>
          )}
          <span>{tenant?.companyName ?? "Trading Terminal"}</span>
        </div>

        <nav className="flex gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-xs font-medium uppercase tracking-wide ${isActive ? "text-accent" : "text-muted hover:text-primary"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {summary && (
          <div className="flex items-center gap-4 font-mono font-tabular text-xs text-muted">
            <span>
              Bal <span className="text-primary">{fmt(summary.balance)}</span>
            </span>
            <span>
              Eq <span className="text-primary">{fmt(summary.equity)}</span>
            </span>
            <span>
              Margin <span className="text-primary">{fmt(summary.marginLevel)}%</span>
            </span>
          </div>
        )}

        <div className="ml-auto flex items-center gap-3 text-xs text-muted">
          <span>{me?.user.email}</span>
          <button
            onClick={() => logout.mutate()}
            className="rounded border border-edge px-2 py-1 text-primary hover:bg-elevated"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
