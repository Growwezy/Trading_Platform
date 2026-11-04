import type { CSSProperties } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, TrendingUp } from "lucide-react";
import DashboardPreview from "@/components/landing/DashboardPreview";
import "@/components/landing/landing.css";

interface LandingHeroProps {
  onOpenForm: () => void;
}

const CYAN = "rgba(150, 225, 255, 0.6)";
const PINK = "rgba(255, 150, 205, 0.6)";

interface Orb {
  x: number; // % from left
  y: number; // % from top
  s: number; // diameter, px
  r: number; // orbit radius, px
  d: number; // orbit duration, s
  t: number; // twinkle duration, s
  dl: number; // animation delay, s (negative = start mid-cycle)
  b?: number; // blur, px
  rev?: boolean; // orbit direction
  tint?: string;
  o?: [number, number]; // twinkle opacity range
}

// Kept to the left/right edges and bottom corners so the headline area stays clean.
const orbs: Orb[] = [
  // crisp sparks
  { x: 6, y: 14, s: 5, r: 34, d: 22, t: 4, dl: -3 },
  { x: 12, y: 30, s: 4, r: 28, d: 30, t: 5, dl: -9, rev: true },
  { x: 4, y: 48, s: 6, r: 40, d: 26, t: 6, dl: -14 },
  { x: 15, y: 62, s: 3, r: 22, d: 19, t: 3.5, dl: -5, rev: true },
  { x: 9, y: 78, s: 5, r: 36, d: 34, t: 5.5, dl: -20 },
  { x: 94, y: 12, s: 5, r: 32, d: 24, t: 4.5, dl: -6, rev: true },
  { x: 88, y: 28, s: 4, r: 26, d: 28, t: 5, dl: -11 },
  { x: 96, y: 46, s: 6, r: 42, d: 32, t: 6.5, dl: -17, rev: true },
  { x: 85, y: 60, s: 3, r: 24, d: 20, t: 3, dl: -2 },
  { x: 92, y: 76, s: 5, r: 34, d: 27, t: 4.8, dl: -13, rev: true },
  { x: 24, y: 10, s: 3, r: 20, d: 21, t: 4, dl: -8 },
  { x: 77, y: 9, s: 3, r: 20, d: 23, t: 5, dl: -4, rev: true },
  // soft glows
  { x: 10, y: 40, s: 14, r: 50, d: 40, t: 7, dl: -12, b: 1.5 },
  { x: 90, y: 38, s: 12, r: 46, d: 44, t: 8, dl: -25, b: 1.5, rev: true },
  { x: 20, y: 84, s: 16, r: 44, d: 38, t: 7.5, dl: -30, b: 2 },
  { x: 82, y: 84, s: 14, r: 44, d: 36, t: 7, dl: -5, b: 2, rev: true, tint: PINK },
  // large blurred bokeh
  { x: 7, y: 22, s: 46, r: 60, d: 55, t: 9, dl: -20, b: 7, o: [0.15, 0.45] },
  { x: 93, y: 58, s: 56, r: 64, d: 60, t: 10, dl: -35, b: 8, rev: true, tint: PINK, o: [0.15, 0.45] },
  { x: 30, y: 80, s: 40, r: 50, d: 50, t: 9, dl: -15, b: 6, o: [0.15, 0.4] },
];

const orbStyle = (o: Orb): CSSProperties =>
  ({
    "--x": `${o.x}%`,
    "--y": `${o.y}%`,
    "--s": `${o.s}px`,
    "--r": `${o.r}px`,
    "--d": `${o.d}s`,
    "--t": `${o.t}s`,
    "--dl": `${o.dl}s`,
    "--b": `${o.b ?? 0}px`,
    "--dir": o.rev ? "reverse" : "normal",
    "--tint": o.tint ?? CYAN,
    "--o1": o.o?.[0] ?? 0.45,
    "--o2": o.o?.[1] ?? 1,
  }) as CSSProperties;

const labels = ["Branded Broker Websites", "Live Forex, Crypto & Commodities", "Complete Broker Admin Panel"];

const LandingHero = ({ onOpenForm }: LandingHeroProps) => {
  const reduce = useReducedMotion();

  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] as const },
  });

  return (
    <section
      id="top"
      className="lp-root lp-hero relative isolate overflow-hidden text-white min-h-[100svh] pb-28 sm:pb-32"
    >
      {/* Particles: orbiting speckle layers (dense at the edges) + glowing orbs on circular paths */}
      <div className="lp-particles" aria-hidden="true">
        <div className="lp-mask-edges">
          <div className="lp-speck lp-speck-a" />
          <div className="lp-speck lp-speck-b" />
        </div>
        <div className="lp-mask-center">
          <div className="lp-speck lp-speck-c" />
        </div>
        <div className="lp-orbs">
          {orbs.map((o, i) => (
            <span key={i} className="lp-orb" style={orbStyle(o)} />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center pt-[clamp(96px,19vh,190px)]">
        {/* Contextual labels */}
        <motion.ul
          {...fadeUp(0.05)}
          className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] sm:text-xs text-white/75"
        >
          {labels.map((l) => (
            <li key={l} className="flex items-center gap-1.5">
              <span className="text-cyan-200" aria-hidden="true">→</span>
              {l}
            </li>
          ))}
        </motion.ul>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.12)}
          className="mx-auto mt-5 sm:mt-6 max-w-4xl font-heading font-light tracking-tight text-[2.1rem] leading-[1.1] sm:text-5xl lg:text-[3.75rem] xl:text-[4rem]"
        >
          <span className="lp-headline-glow relative inline-block whitespace-nowrap">
            Run Your Own Branded
            {/* floating glass chip, top-right of line one */}
            <span
              className="lp-float lp-chip-glass absolute -right-9 sm:-right-12 -top-3 sm:-top-4 hidden sm:grid place-items-center w-9 h-9 lg:w-11 lg:h-11 rounded-xl rotate-[8deg]"
              aria-hidden="true"
            >
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </span>
          </span>
          <br />
          <span className="relative inline-block">
            {/* floating blue chip, left of line two */}
            <span
              className="lp-float-slow lp-chip-blue absolute -left-11 sm:-left-14 top-1/2 -translate-y-1/2 hidden sm:grid place-items-center w-8 h-8 lg:w-10 lg:h-10 rounded-full"
              aria-hidden="true"
            >
              <ShieldCheck className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
            </span>
            <span className="lp-headline-accent">Trading Platform</span>
          </span>
        </motion.h1>

        <motion.p
          {...fadeUp(0.22)}
          className="mx-auto mt-4 sm:mt-5 max-w-[34rem] text-[13px] sm:text-[15px] leading-relaxed text-white/75"
        >
          Growwezy gives every broker a branded trading website for their traders, live market charts, and a full admin panel for KYC, deposits and withdrawals.
        </motion.p>

        <motion.div
          {...fadeUp(0.3)}
          className="mt-6 sm:mt-7 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            type="button"
            onClick={onOpenForm}
            className="lp-btn-primary w-full sm:w-auto rounded-full px-7 py-2.5 text-[13px] font-medium text-white"
          >
            Become a Broker <span aria-hidden="true">→</span>
          </button>
          <a
            href="#contact"
            className="lp-btn-ghost w-full sm:w-auto rounded-full px-7 py-2.5 text-[13px] font-medium text-white text-center"
          >
            Request Demo
          </a>
        </motion.div>
      </div>

      {/* hero blends into the page flow below */}
      <div className="lp-hero-fade" aria-hidden="true" />

      {/* One layered dashboard composition (never clipped: the hero grows to contain it) */}
      <DashboardPreview />
    </section>
  );
};

export default LandingHero;
