import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { BarChart3, Check, FileCheck2, Settings, TrendingUp, Users, Wallet } from "lucide-react";

/* The broker's admin workspace. While active, requests get approved one by one and the
   sidebar follows the item being handled. Illustrative sample data only. */

const nav = [
  { label: "Customers", icon: Users },
  { label: "KYC", icon: FileCheck2 },
  { label: "Deposits", icon: Wallet },
  { label: "Trading", icon: TrendingUp },
  { label: "Settings", icon: Settings },
  { label: "Reports", icon: BarChart3 },
];

const rows = [
  { section: 2, title: "Deposit · $500", who: "A. Khan", pending: "Pending", done: "Approved", tint: "from-[#1f5bff] to-[#38d5ff]" },
  { section: 1, title: "KYC documents", who: "S. Mehta", pending: "In review", done: "Approved", tint: "from-[#ff4fa3] to-[#ff8cc8]" },
  { section: 2, title: "Withdrawal · $200", who: "R. Das", pending: "Under review", done: "Paid", tint: "from-[#6a5cff] to-[#9a8bff]" },
  { section: 0, title: "New customer", who: "L. Chen", pending: "Pending", done: "Active", tint: "from-[#38d5ff] to-[#d7f3ff]" },
];

const STEP_MS = 1500;

const BrokerPanelVisual = ({ active }: { active: boolean }) => {
  const reduce = useReducedMotion();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active || reduce) return;
    const id = window.setInterval(() => setTick((t) => t + 1), STEP_MS);
    return () => window.clearInterval(id);
  }, [active, reduce]);

  // phase 0: all pending · 1..4: that many approved · 5: hold · then loop
  const phase = reduce ? 3 : tick % (rows.length + 2);
  const approved = Math.min(phase, rows.length);
  const current = Math.min(phase, rows.length - 1);
  const activeNav = rows[current].section;
  const pendingCount = rows.length - approved;

  return (
    <div className="relative w-full max-w-[540px]">
      <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(closest-side,rgba(47,107,255,0.45),transparent_75%)] blur-2xl" aria-hidden="true" />
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#050d3f]/85 backdrop-blur-md shadow-[0_50px_100px_-40px_rgba(0,0,0,0.8)]">
        {/* window bar */}
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
          <i className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <i className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <i className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="ml-3 flex-1 truncate rounded-full bg-white/10 px-3 py-1 text-[10.5px] text-white/55">yourbroker.…/admin</span>
        </div>

        <div className="grid grid-cols-[132px_1fr] sm:grid-cols-[148px_1fr]">
          {/* sidebar */}
          <ul className="border-r border-white/10 p-3 space-y-1">
            {nav.map((n, i) => {
              const on = i === activeNav;
              return (
                <li
                  key={n.label}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] transition-all duration-500 ${
                    on ? "bg-white/15 text-white shadow-[inset_2px_0_0_#38d5ff]" : "text-white/50"
                  }`}
                >
                  <n.icon className="w-3.5 h-3.5 shrink-0" />
                  {n.label}
                </li>
              );
            })}
          </ul>

          {/* main */}
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { k: String(128 + (approved === rows.length ? 1 : 0)), l: "Customers" },
                { k: String(pendingCount), l: "Pending" },
                { k: "34", l: "Open positions" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2">
                  <p className="font-heading text-[19px] font-medium tabular-nums leading-none transition-all duration-500">{s.k}</p>
                  <p className="mt-1 text-[9.5px] text-white/55">{s.l}</p>
                </div>
              ))}
            </div>

            <p className="mb-2 text-[10px] uppercase tracking-[0.14em] text-white/40">Requests</p>
            <ul className="space-y-2">
              {rows.map((r, i) => {
                const done = i < approved;
                const isCurrent = i === current && !done;
                return (
                  <li
                    key={r.title}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-500 ${
                      isCurrent ? "border-white/35 bg-white/[0.12]" : "border-white/10 bg-white/[0.04]"
                    }`}
                  >
                    <span className={`w-8 h-8 shrink-0 rounded-full bg-gradient-to-br ${r.tint}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">{r.title}</p>
                      <p className="text-[10.5px] text-white/50">{r.who}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all duration-500 ${
                        done ? "bg-emerald-400/20 text-emerald-200" : "bg-pink-400/20 text-pink-200"
                      }`}
                    >
                      {done && <Check className="w-3 h-3" />}
                      {done ? r.done : r.pending}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrokerPanelVisual;
