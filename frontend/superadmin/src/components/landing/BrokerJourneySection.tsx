import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, BadgeCheck, Check, FileText, Rocket, ShieldCheck, SlidersHorizontal, Wand2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Reveal from "@/components/landing/Reveal";

/* Start Your Broker Journey = a sliding accordion of tall rounded cards. One card is open
   (wide) at a time, the rest stay narrow; the open card moves along on a timer, or on
   hover / tap. Each card is one step of the broker onboarding flow from the vendor brief. */

const STEP_MS = 3600;

/* ---- small illustrations drawn in CSS (no photos needed) ---- */
const Row = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center gap-3 rounded-xl border border-white/25 bg-white/15 px-3.5 py-2.5 backdrop-blur-sm">{children}</div>
);

const ApplyVisual = () => (
  <div className="space-y-2.5">
    {[
      ["Company name", 78],
      ["Documents", 55],
      ["Logo", 92],
    ].map(([l, w]) => (
      <Row key={l as string}>
        <span className="w-24 shrink-0 text-[11px] text-white/80">{l}</span>
        <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/25">
          <i className="block h-full rounded-full bg-white/85" style={{ width: `${w}%` }} />
        </span>
      </Row>
    ))}
  </div>
);

const ReviewVisual = () => (
  <div className="space-y-2.5">
    {["Company details", "Documents", "Logo"].map((l) => (
      <Row key={l}>
        <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[#1233c4]">
          <Check className="h-3 w-3" />
        </span>
        <span className="flex-1 text-[12px] text-white/90">{l} checked</span>
      </Row>
    ))}
    <Row>
      <span className="flex-1 text-[12px] font-medium text-white">Decision</span>
      <span className="rounded-full bg-emerald-300/30 px-2.5 py-1 text-[10px] font-semibold text-emerald-50">Approved</span>
    </Row>
  </div>
);

const CreateVisual = () => (
  <div className="space-y-2.5">
    <Row>
      <span className="text-[11px] text-white/70">Subdomain</span>
      <span className="flex-1 truncate text-right text-[12px] font-medium text-white">yourbroker.…</span>
    </Row>
    <Row>
      <ShieldCheck className="h-4 w-4 text-white" />
      <span className="flex-1 text-[12px] text-white/90">Admin login created</span>
    </Row>
    <Row>
      <span className="text-[11px] text-white/70">Branding</span>
      <span className="ml-auto flex items-center gap-1.5">
        <i className="h-5 w-5 rounded-md bg-white" />
        <i className="h-5 w-5 rounded-md bg-[#38d5ff]" />
        <i className="h-5 w-5 rounded-md bg-[#ff4fa3]" />
      </span>
    </Row>
  </div>
);

const Switch = () => (
  <span className="relative h-[18px] w-8 shrink-0 rounded-full bg-white/85">
    <i className="absolute right-[2px] top-[2px] h-[14px] w-[14px] rounded-full bg-[#5b43e8]" />
  </span>
);

const ConfigureVisual = () => (
  <div className="space-y-2">
    {["Bank transfer", "USDT · BEP20 / TRC20", "Trading symbols", "KYC form"].map((l) => (
      <Row key={l}>
        <span className="flex-1 text-[12px] text-white/90">{l}</span>
        <Switch />
      </Row>
    ))}
  </div>
);

const GoLiveVisual = () => (
  <div className="overflow-hidden rounded-2xl border border-white/30 bg-white/15 backdrop-blur-sm">
    <div className="flex items-center gap-1.5 border-b border-white/20 px-3 py-2">
      <i className="h-2 w-2 rounded-full bg-white/40" />
      <i className="h-2 w-2 rounded-full bg-white/40" />
      <i className="h-2 w-2 rounded-full bg-white/40" />
      <span className="ml-2 flex-1 truncate rounded-full bg-white/20 px-2.5 py-0.5 text-[10px] text-white/80">yourbroker.…</span>
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-300/30 px-2 py-0.5 text-[9px] font-semibold text-emerald-50">
        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200" /> LIVE
      </span>
    </div>
    <div className="space-y-2 p-3">
      <i className="block h-9 rounded-lg bg-white/30" />
      <div className="flex gap-2">
        <i className="block h-12 flex-1 rounded-lg bg-white/20" />
        <i className="block h-12 flex-1 rounded-lg bg-white/20" />
        <i className="block h-12 flex-1 rounded-lg bg-white/20" />
      </div>
    </div>
  </div>
);

const steps: { n: string; t: string; d: string; accent: string; icon: LucideIcon; visual: ReactNode }[] = [
  { n: "01", t: "Apply", icon: FileText, d: "Send your company details, documents and logo.", accent: "linear-gradient(135deg,#1f5bff 0%,#38d5ff 100%)", visual: <ApplyVisual /> },
  { n: "02", t: "Review", icon: BadgeCheck, d: "Growwezy checks the application and approves or rejects it.", accent: "linear-gradient(135deg,#5b43e8 0%,#9a8bff 100%)", visual: <ReviewVisual /> },
  { n: "03", t: "Create", icon: Wand2, d: "We set up your subdomain, admin login and branding.", accent: "linear-gradient(135deg,#c93a9c 0%,#ff7ac2 100%)", visual: <CreateVisual /> },
  { n: "04", t: "Configure", icon: SlidersHorizontal, d: "Choose your payments, symbols and KYC form.", accent: "linear-gradient(135deg,#2f6bff 0%,#8a5cff 100%)", visual: <ConfigureVisual /> },
  { n: "05", t: "Go live", icon: Rocket, d: "Share your website with traders and start running your business.", accent: "linear-gradient(135deg,#ff4fa3 0%,#9a4dff 100%)", visual: <GoLiveVisual /> },
];

const BrokerJourneySection = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapRef, { margin: "-80px" });
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // auto-advance; restarts whenever the active card changes or hover ends
  useEffect(() => {
    if (reduce || paused || !inView) return;
    const id = window.setTimeout(() => setActive((a) => (a + 1) % steps.length), STEP_MS);
    return () => window.clearTimeout(id);
  }, [active, paused, inView, reduce]);

  return (
    <section id="start" className="lp-root lp-sec scroll-mt-4 py-20 sm:py-28">
      <div className="lp-sec-content container mx-auto px-4 sm:px-6">
        {/* heading row */}
        <div className="mb-10 flex flex-col gap-8 sm:mb-14 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Reveal>
              <span className="lp-eyebrow">Become a broker</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-heading font-light tracking-tight text-[2.1rem] leading-[1.08] sm:text-5xl lg:text-[3.4rem]">
                Start Your Broker
                <br />
                <span className="lp-headline-accent">Journey Today</span>
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.16}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/apply" className="lp-btn-primary inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold text-white">
                Become a Broker <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#contact" className="lp-btn-ghost inline-flex items-center justify-center rounded-full px-7 py-3 text-[14px] font-medium text-white">
                Request Demo
              </a>
            </div>
          </Reveal>
        </div>

        {/* sliding cards */}
        <Reveal delay={0.1} y={40}>
          <div
            ref={wrapRef}
            className="flex h-[540px] flex-col gap-3 sm:h-[300px] sm:flex-row"
            onMouseLeave={() => setPaused(false)}
          >
            {steps.map((s, i) => {
              const on = active === i;
              return (
                <div
                  key={s.n}
                  role="button"
                  tabIndex={0}
                  aria-expanded={on}
                  aria-label={`Step ${s.n}: ${s.t}`}
                  onMouseEnter={() => {
                    setPaused(true);
                    setActive(i);
                  }}
                  onFocus={() => setActive(i)}
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setActive(i);
                    }
                  }}
                  style={{ flexGrow: on ? 4.2 : 1, flexBasis: 0 }}
                  className={`relative min-h-[64px] cursor-pointer overflow-hidden rounded-[32px] border outline-none transition-[flex-grow,border-color,box-shadow] duration-[900ms] ease-[cubic-bezier(0.7,0,0.2,1)] focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none sm:min-h-0 ${
                    on
                      ? "border-white/35 shadow-[0_40px_90px_-30px_rgba(10,20,120,0.9),0_0_60px_-15px_rgba(255,79,163,0.5)]"
                      : "border-white/12"
                  }`}
                >
                  {/* resting (collapsed) look */}
                  <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(24,44,130,0.6),rgba(8,20,70,0.6))] backdrop-blur-md" />
                  {/* accent colour fades in when open */}
                  <div
                    className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
                    style={{ background: s.accent, opacity: on ? 1 : 0 }}
                  />
                  <div
                    className="absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none"
                    style={{
                      opacity: on ? 1 : 0,
                      background: "radial-gradient(ellipse 70% 60% at 20% 0%, rgba(255,255,255,0.35), transparent 70%)",
                    }}
                  />

                  {/* collapsed label */}
                  <div
                    className={`absolute inset-0 flex items-center gap-3.5 px-4 transition-opacity duration-500 motion-reduce:transition-none sm:flex-col sm:justify-between sm:px-0 sm:py-5 ${
                      on ? "pointer-events-none opacity-0" : "opacity-100 delay-300"
                    }`}
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.6)]" style={{ background: s.accent }}>
                      <s.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-heading text-[17px] font-medium text-white/85 sm:[text-orientation:mixed] sm:[writing-mode:vertical-rl] sm:rotate-180 sm:text-[19px]">
                      {s.t}
                    </span>
                    <span className="ml-auto font-heading text-[12px] font-medium tracking-widest text-white/45 sm:ml-0">{s.n}</span>
                  </div>

                  {/* expanded content (fixed width on xl so text never reflows while sliding) */}
                  <div
                    className={`absolute inset-y-0 left-0 flex w-full flex-col justify-end gap-4 p-6 transition-opacity duration-500 motion-reduce:transition-none sm:p-7 xl:min-w-[560px] xl:flex-row xl:items-center xl:justify-between ${
                      on ? "opacity-100 delay-[350ms]" : "pointer-events-none opacity-0"
                    }`}
                  >
                    <div className="max-w-[17rem]">
                      <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl border border-white/30 bg-white/20 text-white backdrop-blur-sm">
                        <s.icon className="h-5 w-5" />
                      </span>
                      <p className="font-heading text-[12px] font-medium tracking-[0.2em] text-white/70">STEP {s.n}</p>
                      <h3 className="mt-2 font-heading text-[2rem] font-medium leading-none sm:text-[2.3rem]">{s.t}</h3>
                      <p className="mt-3 text-[14px] leading-relaxed text-white/85">{s.d}</p>
                    </div>
                    <div className="hidden w-[250px] shrink-0 xl:block">{s.visual}</div>
                  </div>

                  {/* story-style progress bar */}
                  {on && !paused && !reduce && (
                    <span className="absolute inset-x-6 bottom-4 h-[3px] overflow-hidden rounded-full bg-white/25 sm:inset-x-8">
                      <i key={`${active}-${paused}`} className="lp-progress block h-full w-full rounded-full bg-white" style={{ ["--ms" as string]: `${STEP_MS}ms` }} />
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default BrokerJourneySection;
