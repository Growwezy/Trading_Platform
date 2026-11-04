import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import Reveal from "@/components/landing/Reveal";

/* Features = four giant numerals. When the section scrolls into view each digit rolls like an
   odometer — spinning through 0–9 — and lands on 1, 2, 3, 4 (bigger numbers spin a little longer). */

const features = [
  {
    title: "Markets & Trading",
    text: "Forex, cryptocurrency and commodities with live charts. Buy and sell with Stop Loss and Take Profit, and follow open positions and live profit and loss.",
  },
  {
    title: "KYC & Payments",
    text: "Each broker sets its own KYC form. Traders deposit by bank transfer or USDT with proof, and the broker checks, approves and marks every request.",
  },
  {
    title: "Copy & Refer",
    text: "Copy the referrer or accounts the broker has listed. Share a referral link and see referred users and earnings.",
  },
  {
    title: "Your Brand, Your Panel",
    text: "Your own subdomain, logo and colours — plus an admin panel for customers, trading settings, reports and team access.",
  },
];

interface DigitProps {
  target: number;
  delay: number;
  play: boolean;
  reduce: boolean | null;
}

/* A column of digits 0–9 (then 0..target again) that slides up and stops on `target`. */
const RollingDigit = ({ target, delay, play, reduce }: DigitProps) => {
  const digits = Array.from({ length: 10 + target + 1 }, (_, i) => i % 10);
  const finalIndex = digits.length - 1;
  const endY = `-${(finalIndex / digits.length) * 100}%`;
  const landed = play || reduce;

  return (
    <>
      <span className="sr-only">{target}</span>
      <span className="relative inline-block h-[1em] overflow-hidden align-top" aria-hidden="true">
        <motion.span
          className="block"
          initial={false}
          animate={{ y: landed ? endY : "0%" }}
          transition={reduce ? { duration: 0 } : { duration: 1.5 + target * 0.22, delay, ease: [0.16, 1, 0.3, 1] }}
        >
          {digits.map((d, i) => (
            <span key={i} className="block h-[1em] leading-[1em]">
              {d}
            </span>
          ))}
        </motion.span>
      </span>
    </>
  );
};

const FeaturesSection = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(gridRef, { once: true, margin: "-140px" });
  const reduce = useReducedMotion();

  return (
    <section id="features" className="lp-root lp-sec scroll-mt-4 pt-10 pb-28 sm:pt-12 sm:pb-36">
      <div className="lp-sec-content container mx-auto px-4 sm:px-6">
        <Reveal>
          <span className="lp-eyebrow">Features</span>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 className="mt-5 max-w-3xl font-heading font-light tracking-tight text-[2rem] leading-[1.1] sm:text-5xl">
            A complete platform for
            <br />
            <span className="lp-headline-accent">brokers and their traders</span>
          </h2>
        </Reveal>

        <div ref={gridRef} className="mt-16 sm:mt-24 grid gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          {features.map((f, i) => (
            <div key={f.title}>
              {/* giant rolling numeral */}
              <p
                className="font-heading font-bold leading-none tracking-tighter text-white text-[clamp(6.5rem,12vw,10.5rem)] drop-shadow-[0_0_40px_rgba(90,150,255,0.45)]"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                <RollingDigit target={i + 1} delay={i * 0.18} play={inView} reduce={reduce} />
              </p>

              <Reveal delay={0.25 + i * 0.12} y={20}>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-white/45 via-white/15 to-transparent" />
                <h3 className="mt-5 font-heading text-[21px] font-medium uppercase tracking-tight leading-tight">{f.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-white/65">{f.text}</p>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
