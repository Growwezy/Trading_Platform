import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Building2, CandlestickChart, CheckCircle2, CircleDashed, Loader2, TrendingUp } from "lucide-react";
import LiveCandleChart from "@/components/landing/LiveCandleChart";

/* Illustrative sample data only — not connected to any backend.
   Wording follows the Growwezy vendor brief (Growwezy_Interactive_Vendor_Flow_Enhanced.pptx). */

type StepState = "done" | "running" | "queued";

/* Broker onboarding: apply → review → decision → create → configure → go live */
const onboardingSteps: { t: string; d: string; s: StepState }[] = [
  { t: "Apply", d: "Company details, documents and logo", s: "done" },
  { t: "Review", d: "Growwezy checks the application", s: "done" },
  { t: "Decision", d: "Approved", s: "done" },
  { t: "Create", d: "Subdomain, admin login and branding", s: "running" },
  { t: "Configure", d: "Payments, symbols and KYC form", s: "queued" },
  { t: "Go live", d: "Share the website with traders", s: "queued" },
];

/* Trader journey: sign up → KYC → approval → deposit → trade */
const traderSteps = [
  { t: "Sign up", done: true },
  { t: "KYC", done: true },
  { t: "Approval", done: true },
  { t: "Deposit", done: true },
  { t: "Trade", done: false },
];

const riseIn = (delay: number, reduce: boolean | null) => ({
  initial: reduce ? false : { opacity: 0, y: 90 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, delay, ease: [0.2, 0.8, 0.2, 1] as const },
});

const Pill = ({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "pink" | "glass" }) => {
  const tones = {
    blue: "bg-blue-50 text-blue-700",
    green: "bg-emerald-50 text-emerald-700",
    pink: "bg-pink-50 text-pink-600",
    glass: "bg-white/20 text-white border border-white/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
};

const IconChip = ({ icon: Icon, light = false }: { icon: typeof Building2; light?: boolean }) => (
  <span
    className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 text-white ${
      light ? "bg-white/20 border border-white/35" : "bg-gradient-to-br from-[#1f5bff] to-[#38d5ff]"
    }`}
  >
    <Icon className="w-[18px] h-[18px]" />
  </span>
);

const StateIcon = ({ s, light = false }: { s: StepState; light?: boolean }) => {
  if (s === "done") return <CheckCircle2 className={`w-4 h-4 shrink-0 ${light ? "text-white" : "text-emerald-500"}`} />;
  if (s === "running") return <Loader2 className={`w-4 h-4 shrink-0 animate-spin ${light ? "text-white" : "text-blue-600"}`} />;
  return <CircleDashed className={`w-4 h-4 shrink-0 ${light ? "text-white/70" : "text-slate-300"}`} />;
};

/* ---------- Right: live price chart ---------- */
const MiniChart = () => (
  <svg viewBox="0 0 300 84" className="w-full" role="img" aria-label="Live price chart with stop loss">
    <defs>
      <linearGradient id="lp-area" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1f5bff" stopOpacity="0.28" />
        <stop offset="1" stopColor="#1f5bff" stopOpacity="0" />
      </linearGradient>
    </defs>
    {[16, 38, 60].map((y) => (
      <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#e6edfb" strokeWidth="1" />
    ))}
    <path d="M0 64 C 30 60, 50 50, 80 46 S 130 42, 160 30 S 230 20, 300 10 L300 84 L0 84 Z" fill="url(#lp-area)" />
    <path d="M0 64 C 30 60, 50 50, 80 46 S 130 42, 160 30 S 230 20, 300 10" fill="none" stroke="#1f5bff" strokeWidth="2.4" strokeLinecap="round" />
    <line x1="0" x2="300" y1="68" y2="68" stroke="#ff4fa3" strokeWidth="1.6" strokeDasharray="5 4" />
    <circle cx="160" cy="30" r="5.5" fill="#fff" stroke="#1f5bff" strokeWidth="2.4" />
  </svg>
);

const DashboardPreview = () => {
  const reduce = useReducedMotion();

  return (
    <div
      id="platform"
      className="relative z-10 mt-10 lg:mt-[clamp(48px,11vh,110px)] mx-auto w-full lg:w-[min(1100px,94vw)]"
    >
      <div className="lp-bloom" aria-hidden="true" />
      <div className="lp-scroll-row flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory px-4 pb-2 lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0">
        {/* ============ LEFT — Broker Onboarding ============ */}
        <div className="lp-panel-wrap snap-center shrink-0 flex flex-col w-[84vw] max-w-[340px] lg:max-w-none lg:w-[36%] lg:relative lg:top-7 lg:z-10 lg:[--lp-rot:-4deg] lg:-rotate-[4deg]">
          <motion.article {...riseIn(0.35, reduce)} className="lp-panel flex-1 p-5 lg:p-6 lg:pr-10 text-left">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <IconChip icon={Building2} />
                <div className="min-w-0">
                  <h3 className="font-heading font-medium text-[15px] text-slate-900 leading-tight truncate">Broker Onboarding</h3>
                  <p className="text-[10.5px] text-slate-500">From apply to go live</p>
                </div>
              </div>
              <Pill tone="green"><Loader2 className="w-3 h-3 animate-spin" /> Active</Pill>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { k: "4", l: "In review" },
                { k: "12", l: "Approved" },
                { k: "1", l: "Rejected" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                  <p className="font-heading text-[19px] font-medium text-slate-900 tabular-nums leading-none">{s.k}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{s.l}</p>
                </div>
              ))}
            </div>

            <p className="text-[10.5px] uppercase tracking-wider text-slate-400 mb-2.5">Apex Markets · application</p>
            <ul className="space-y-3">
              {onboardingSteps.map((st) => (
                <li key={st.t} className="flex items-start gap-2.5">
                  <span className="mt-0.5"><StateIcon s={st.s} /></span>
                  <div className="min-w-0">
                    <p className={`text-[12px] font-medium leading-tight ${st.s === "queued" ? "text-slate-400" : "text-slate-800"}`}>{st.t}</p>
                    <p className="text-[10.5px] text-slate-500 leading-snug">{st.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.article>
        </div>

        {/* ============ CENTRE — Live Markets (pink) ============ */}
        <div className="lp-panel-wrap snap-center shrink-0 flex flex-col w-[84vw] max-w-[340px] lg:max-w-none lg:w-[36%] lg:-ml-[4%] lg:z-20">
          <motion.article {...riseIn(0.15, reduce)} className="lp-panel lp-panel-pink flex-1 p-5 lg:p-6 text-left text-white">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <IconChip icon={CandlestickChart} light />
                <div className="min-w-0">
                  <h3 className="font-heading font-medium text-[15px] leading-tight truncate">Live Markets</h3>
                  <p className="text-[10.5px] text-white/75">Forex · Crypto · Commodities</p>
                </div>
              </div>
              <Pill tone="glass"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live</Pill>
            </div>
            <LiveCandleChart symbol="BTC/USDT" />
          </motion.article>
        </div>

        {/* ============ RIGHT — Trader Terminal ============ */}
        <div className="lp-panel-wrap snap-center shrink-0 flex flex-col w-[84vw] max-w-[340px] lg:max-w-none lg:w-[36%] lg:-ml-[4%] lg:relative lg:top-8 lg:z-10 lg:[--lp-rot:3deg] lg:rotate-[3deg]">
          <motion.article {...riseIn(0.5, reduce)} className="lp-panel flex-1 p-5 lg:p-6 lg:pl-12 text-left">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <IconChip icon={TrendingUp} />
                <div className="min-w-0">
                  <h3 className="font-heading font-medium text-[15px] text-slate-900 leading-tight truncate">Trader Terminal</h3>
                  <p className="text-[10.5px] text-slate-500">Forex · Crypto · Commodities</p>
                </div>
              </div>
              <Pill><span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" /> Live</Pill>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { k: "3", l: "Open positions" },
                { k: "+$248", l: "Live profit / loss" },
                { k: "$5,000", l: "Balance" },
              ].map((s) => (
                <div key={s.l} className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                  <p className="font-heading text-[18px] font-medium text-slate-900 tabular-nums leading-none">{s.k}</p>
                  <p className="mt-1 text-[9.5px] text-slate-500 leading-tight">{s.l}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-1">
              <p className="text-[10.5px] uppercase tracking-wider text-slate-400">EUR/USD · live chart</p>
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#1f5bff]" /> Price</span>
                <span className="flex items-center gap-1"><i className="w-2 h-2 rounded-full bg-[#ff4fa3]" /> Stop Loss</span>
              </div>
            </div>
            <MiniChart />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <span className="rounded-xl bg-gradient-to-r from-[#1f5bff] to-[#38d5ff] py-2 text-center text-[12px] font-semibold text-white">Buy</span>
              <span className="rounded-xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8cc8] py-2 text-center text-[12px] font-semibold text-white">Sell</span>
            </div>

            <p className="mt-4 mb-2.5 text-[10.5px] uppercase tracking-wider text-slate-400">Account status</p>
            <div className="flex items-start justify-between">
              {traderSteps.map((st) => (
                <div key={st.t} className="flex flex-col items-center gap-1 text-[10px] text-slate-600">
                  {st.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                  )}
                  {st.t}
                </div>
              ))}
            </div>

          </motion.article>
        </div>
      </div>
    </div>
  );
};

export default DashboardPreview;
