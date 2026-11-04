import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/* A simulated live market: candles form tick by tick, the price moves up AND down,
   new candles slide in from the right. Illustrative only — not real market data. */

interface Candle {
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

interface Stats {
  price: number;
  changePct: number;
  high: number;
  low: number;
  volume: number;
  up: boolean;
}

interface LiveCandleChartProps {
  symbol?: string;
  /** canvas panel height in px */
  height?: number;
  /** show the High / Low / Volume tiles and the "simulated" note */
  showStats?: boolean;
  /** candles on screen */
  visibleCandles?: number;
  /** stop ticking (e.g. when the chart is not the active step) */
  paused?: boolean;
}

const TICKS_PER_CANDLE = 16;
const TICK_MS = 140;
const START_PRICE = 67420;
const BULL = "#35e0a1";
const BEAR = "#ff5d7d";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const gauss = () => {
  // Box–Muller
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

/* Price process: mean-reverting random walk around a drifting anchor, with
   per-candle momentum that flips direction and volatility clustering. */
const createMarket = (visibleN: number) => {
  let price = START_PRICE;
  let anchor = START_PRICE;
  let trend = 0;
  let vol = 9;
  let ticks = 0;
  let cur: Candle = { o: price, h: price, l: price, c: price, v: 0 };
  const done: Candle[] = [];

  const tick = (): boolean => {
    anchor += gauss() * 5 + trend * 1.4;
    vol = clamp(vol * 0.93 + Math.abs(gauss()) * 1.6 + 0.4, 5, 24);
    const shock = gauss() * vol;
    price += (anchor - price) * 0.07 + shock + trend * 1.6;
    cur.c = price;
    cur.h = Math.max(cur.h, price);
    cur.l = Math.min(cur.l, price);
    cur.v += Math.abs(shock) * (0.6 + Math.random() * 0.8);
    ticks += 1;
    if (ticks >= TICKS_PER_CANDLE) {
      done.push(cur);
      if (done.length > visibleN * 3) done.shift();
      cur = { o: price, h: price, l: price, c: price, v: 0 };
      ticks = 0;
      // new candle: often reverse, sometimes keep going — so it swings both ways
      trend = Math.random() < 0.45 ? (Math.random() * 2 - 1) * 2.6 : trend * 0.5;
      return true;
    }
    return false;
  };

  // warm up some history so the chart is full on first paint
  for (let i = 0; i < (visibleN + 4) * TICKS_PER_CANDLE; i++) tick();

  return {
    tick,
    visible: () => [...done.slice(-(visibleN - 1)), cur],
  };
};

const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtVol = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(0));

const computeStats = (candles: Candle[]): Stats => {
  const last = candles[candles.length - 1];
  const first = candles[0];
  return {
    price: last.c,
    changePct: ((last.c - first.o) / first.o) * 100,
    high: Math.max(...candles.map((c) => c.h)),
    low: Math.min(...candles.map((c) => c.l)),
    volume: candles.reduce((s, c) => s + c.v, 0),
    up: last.c >= last.o,
  };
};

const LiveCandleChart = ({
  symbol = "BTC/USDT",
  height = 200,
  showStats = true,
  visibleCandles = 36,
  paused = false,
}: LiveCandleChartProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const reduce = useReducedMotion();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const VISIBLE = visibleCandles;
    const market = createMarket(VISIBLE);
    let size = { w: 300, h: height };
    let lo = 0;
    let hi = 0;
    let slide = 0; // horizontal slide-in offset (px) after a new candle forms
    let running = true;
    let visible = true;
    let raf = 0;
    let lastTick = performance.now();
    let lastStats = 0;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = { w: Math.max(120, r.width), h: Math.max(120, r.height) };
      canvas.width = Math.round(size.w * dpr);
      canvas.height = Math.round(size.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (snapRange: boolean) => {
      const candles = market.visible();
      const { w, h } = size;
      const rightPad = 58;
      const volH = h * 0.16;
      const top = 8;
      const plotH = h - volH - top - 6;
      const plotW = w - rightPad - 6;
      const step = plotW / VISIBLE;
      const cw = Math.max(3, step * 0.62);

      const tl = Math.min(...candles.map((c) => c.l));
      const th = Math.max(...candles.map((c) => c.h));
      const pad = (th - tl) * 0.1 || 1;
      const tLo = tl - pad;
      const tHi = th + pad;
      if (snapRange || hi === lo) {
        lo = tLo;
        hi = tHi;
      } else {
        lo += (tLo - lo) * 0.12; // smooth auto-scale
        hi += (tHi - hi) * 0.12;
      }
      const y = (p: number) => top + (1 - (p - lo) / (hi - lo)) * plotH;

      ctx.clearRect(0, 0, w, h);

      // grid + price labels
      ctx.font = "10px Inter, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      for (let i = 0; i <= 3; i++) {
        const gy = top + (plotH * i) / 3;
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w - rightPad, gy);
        ctx.stroke();
        const price = hi - ((hi - lo) * i) / 3;
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillText(price.toFixed(0), w - rightPad + 8, gy);
      }

      const vmax = Math.max(...candles.map((c) => c.v), 1);
      const x0 = 2 + slide;

      candles.forEach((c, i) => {
        const cx = x0 + (i + 0.5) * step;
        const up = c.c >= c.o;
        const col = up ? BULL : BEAR;

        // volume
        ctx.fillStyle = up ? "rgba(53,224,161,0.32)" : "rgba(255,93,125,0.32)";
        const vh = Math.max(1, (c.v / vmax) * volH);
        ctx.fillRect(cx - cw / 2, h - vh - 2, cw, vh);

        // wick
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(cx, y(c.h));
        ctx.lineTo(cx, y(c.l));
        ctx.stroke();

        // body
        const yo = y(c.o);
        const yc = y(c.c);
        const by = Math.min(yo, yc);
        const bh = Math.max(1.6, Math.abs(yo - yc));
        ctx.fillStyle = col;
        ctx.fillRect(cx - cw / 2, by, cw, bh);
      });

      // live price line + tag
      const last = candles[candles.length - 1];
      const ly = y(last.c);
      const lc = last.c >= last.o ? BULL : BEAR;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = lc;
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, ly);
      ctx.lineTo(w - rightPad, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;

      const tagW = rightPad - 2;
      ctx.fillStyle = lc;
      ctx.beginPath();
      ctx.roundRect(w - rightPad + 2, ly - 9, tagW, 18, 4);
      ctx.fill();
      ctx.fillStyle = "#04102e";
      ctx.font = "600 10px Inter, system-ui, sans-serif";
      ctx.fillText(last.c.toFixed(0), w - rightPad + 7, ly + 0.5);
    };

    const publish = () => setStats(computeStats(market.visible()));

    resize();
    draw(true);
    publish();

    const ro = new ResizeObserver(() => {
      resize();
      draw(true);
    });
    ro.observe(wrap);

    // static chart for reduced-motion users
    if (reduce) {
      return () => ro.disconnect();
    }

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
    });
    io.observe(wrap);

    const loop = (now: number) => {
      if (!running) return;
      if (visible && !pausedRef.current) {
        if (now - lastTick >= TICK_MS) {
          lastTick = now;
          const newCandle = market.tick();
          if (newCandle) slide += (size.w - 64) / VISIBLE;
        }
        slide *= 0.84; // ease the slide back to 0
        if (Math.abs(slide) < 0.05) slide = 0;
        draw(false);
        if (now - lastStats > 250) {
          lastStats = now;
          publish();
        }
      } else {
        lastTick = now; // don't burst-tick after resuming
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, [reduce, visibleCandles, height]);

  const up = stats ? stats.changePct >= 0 : true;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[10.5px] uppercase tracking-wider text-white/70">{symbol} · 1m</p>
          <p className="font-heading text-[30px] font-light leading-tight tabular-nums">{stats ? fmt(stats.price) : "—"}</p>
        </div>
        <span
          className={`mb-1 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums border ${
            up ? "bg-emerald-300/25 border-emerald-200/50 text-emerald-50" : "bg-rose-950/30 border-rose-200/40 text-rose-50"
          }`}
        >
          {stats ? `${up ? "+" : ""}${stats.changePct.toFixed(2)}%` : "—"}
        </span>
      </div>

      <div
        ref={wrapRef}
        style={{ height }}
        className="mt-3 rounded-2xl border border-white/20 bg-[#10063a]/70 p-2 overflow-hidden"
      >
        <canvas ref={canvasRef} className="block w-full h-full" role="img" aria-label={`Simulated live ${symbol} candlestick chart`} />
      </div>

      {showStats && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { k: stats ? fmt(stats.high) : "—", l: "High" },
              { k: stats ? fmt(stats.low) : "—", l: "Low" },
              { k: stats ? fmtVol(stats.volume) : "—", l: "Volume" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl bg-white/15 border border-white/25 py-2">
                <p className="font-heading text-[13px] font-medium tabular-nums leading-none">{s.k}</p>
                <p className="mt-1 text-[9.5px] text-white/80">{s.l}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[9.5px] text-white/55">Simulated market — illustrative only</p>
        </>
      )}
    </div>
  );
};

export default LiveCandleChart;
