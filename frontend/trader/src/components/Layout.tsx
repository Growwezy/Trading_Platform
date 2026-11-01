import { NavLink, Outlet } from "react-router-dom";
import { useLogout, useMe } from "@growwezy/api-client";

const navItems = [
  { to: "/", label: "Terminal" },
  { to: "/holdings", label: "Holdings" },
  { to: "/dashboard", label: "Dashboard" },
];

export function Layout() {
  const { data } = useMe();
  const logout = useLogout();

  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2">
        <nav className="flex gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? "text-sky-400" : "text-slate-400 hover:text-slate-200"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <span>{data?.user.email}</span>
          <button
            onClick={() => logout.mutate()}
            className="rounded bg-slate-800 px-3 py-1 text-slate-200 hover:bg-slate-700"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
