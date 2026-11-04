import { ArrowLeft, Star } from "lucide-react";
import LiveCandleChart from "@/components/landing/LiveCandleChart";

/* The trader's view on a phone: live chart + Buy. Illustrative only. */
const TraderPhoneVisual = ({ active }: { active: boolean }) => (
  <div className="relative mx-auto w-[min(272px,78vw)]">
    <div className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,rgba(255,79,163,0.4),rgba(47,107,255,0.25)_55%,transparent_75%)] blur-2xl" aria-hidden="true" />

    <div className="lp-float relative aspect-[9/15.8] rounded-[2.6rem] border border-white/20 bg-[#050b26] p-4 text-white shadow-[0_60px_100px_-30px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.15)]">
      {/* notch */}
      <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/15" />

      <div className="flex items-center justify-between text-white/70">
        <ArrowLeft className="w-4 h-4" />
        <span className="text-[11px] font-medium text-white/85">BTC/USDT</span>
        <Star className="w-4 h-4" />
      </div>

      <div className="mt-3">
        <LiveCandleChart symbol="Bitcoin" height={168} showStats={false} visibleCandles={26} paused={!active} />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-full bg-white/[0.07] p-1 text-[10px] text-white/50">
        {["1D", "1W", "1M", "6M", "1Y"].map((p) => (
          <span key={p} className={`flex-1 rounded-full py-1 text-center ${p === "1W" ? "bg-white/15 text-white" : ""}`}>
            {p}
          </span>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-[10.5px] text-white/55">
        <span>Open positions · 3</span>
        <span className="font-medium text-emerald-300">+$248</span>
      </div>

      <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-2">
        <span className="rounded-2xl bg-gradient-to-r from-[#1f5bff] to-[#38d5ff] py-3 text-center text-[13px] font-semibold">Buy</span>
        <span className="rounded-2xl bg-gradient-to-r from-[#ff4fa3] to-[#ff8cc8] py-3 text-center text-[13px] font-semibold">Sell</span>
      </div>
    </div>
  </div>
);

export default TraderPhoneVisual;
