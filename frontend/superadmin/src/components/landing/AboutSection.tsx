import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMotionValueEvent, useScroll } from "framer-motion";
import Reveal from "@/components/landing/Reveal";
import OrbitDiagram from "@/components/landing/OrbitDiagram";
import BrokerPanelVisual from "@/components/landing/BrokerPanelVisual";
import TraderPhoneVisual from "@/components/landing/TraderPhoneVisual";

/* About = a pinned, scroll-driven story in three steps (like the reference):
   the section sticks to the screen, one big headline is lit while the others stay faint,
   its text fades in, and the visual on the right changes. Below `lg` the steps simply stack. */

type Seg = { t: string; accent?: boolean };

const steps: { n: string; title: Seg[]; text: string }[] = [
  {
    n: "01",
    title: [{ t: "Who are " }, { t: "we?", accent: true }],
    text: "Growwezy owns the central platform. We give every broker full access — a branded website, an admin panel and a ready trading service for their traders.",
  },
  {
    n: "02",
    title: [{ t: "Broker? Take " }, { t: "full charge", accent: true }, { t: " of the panel." }],
    text: "Your own admin workspace. Manage customers, review KYC, approve deposits and withdrawals, set symbols, leverage and lot size, and give your team access.",
  },
  {
    n: "03",
    title: [{ t: "Trader? Grow with " }, { t: "Growwezy.", accent: true }],
    text: "Live charts across forex, crypto and commodities. Buy and sell with Stop Loss and Take Profit, track positions and profit and loss, deposit, withdraw, copy and refer.",
  },
];

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => (typeof window === "undefined" ? false : window.matchMedia(query).matches));
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
};

const Title = ({ segs, on }: { segs: Seg[]; on: boolean }) => (
  <>
    {segs.map((s, i) => (
      <span key={i} className={s.accent && on ? "lp-headline-accent" : ""}>
        {s.t}
      </span>
    ))}
  </>
);

const headingBase = "font-heading font-semibold uppercase tracking-tight leading-[0.98]";

/* ---------------- desktop: pinned story ---------------- */
const StickyStory = () => {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    setActive(p < 0.33 ? 0 : p < 0.66 ? 1 : 2);
  });

  const visuals = [<OrbitDiagram key="o" />, <BrokerPanelVisual key="b" active={active === 1} />, <TraderPhoneVisual key="t" active={active === 2} />];

  return (
    <section id="about" ref={ref} className="lp-root lp-sec relative h-[330vh]">
      <div className="sticky top-0 flex h-[100svh] items-center">
        <div className="lp-sec-content container mx-auto grid grid-cols-[1.05fr_0.95fr] items-center gap-12 px-6">
          {/* left: big headlines, text fades in for the active one */}
          <div>
            <p className="mb-7 text-[11px] uppercase tracking-[0.22em] text-white/60">
              {steps[active].n} / 03 &nbsp;·&nbsp; About Growwezy
            </p>
            {steps.map((s, i) => {
              const on = active === i;
              return (
                <div key={s.n} className="py-3">
                  <h2
                    className={`${headingBase} text-[clamp(2rem,4vw,3.7rem)] transition-colors duration-700 motion-reduce:transition-none ${
                      on ? "text-white" : "text-white/20"
                    }`}
                  >
                    <Title segs={s.title} on={on} />
                  </h2>
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-700 ease-out motion-reduce:transition-none ${
                      on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-md pt-4 text-[15px] leading-relaxed text-white/75">{s.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* right: the visual changes with the step */}
          <div className="relative h-[min(560px,64svh)]">
            {visuals.map((v, i) => (
              <div
                key={i}
                className={`absolute inset-0 grid place-items-center transition-all duration-700 ease-out motion-reduce:transition-none ${
                  active === i ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none translate-y-6 scale-95 opacity-0"
                }`}
                aria-hidden={active !== i}
              >
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------------- mobile / tablet: stacked ---------------- */
const StackedStory = () => {
  const visuals: ReactNode[] = [<OrbitDiagram key="o" />, <BrokerPanelVisual key="b" active />, <TraderPhoneVisual key="t" active />];
  return (
    <section id="about" className="lp-root lp-sec py-20 sm:py-28">
      <div className="lp-sec-content container mx-auto space-y-24 px-4 sm:px-6">
        {steps.map((s, i) => (
          <div key={s.n}>
            <Reveal>
              <p className="mb-5 text-[11px] uppercase tracking-[0.22em] text-white/60">{s.n} / 03 &nbsp;·&nbsp; About Growwezy</p>
              <h2 className={`${headingBase} text-[clamp(1.9rem,8vw,3rem)] text-white`}>
                <Title segs={s.title} on />
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">{s.text}</p>
            </Reveal>
            <Reveal className="mt-10" delay={0.08}>
              {visuals[i]}
            </Reveal>
          </div>
        ))}
      </div>
    </section>
  );
};

const AboutSection = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  return isDesktop ? <StickyStory /> : <StackedStory />;
};

export default AboutSection;
