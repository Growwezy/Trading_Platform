import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Building2, Send, UserRound, Video } from "lucide-react";
import Reveal from "@/components/landing/Reveal";

const labelClass = "block text-[12px] font-medium text-slate-600 mb-1.5";

const ContactSection = () => {
  // The contact form is UI only for now — there is no backend endpoint to send it to.
  // Say so on the page rather than pretending the message was delivered.
  const [shown, setShown] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setShown(true);
  };

  return (
    <section id="contact" className="lp-root lp-sec scroll-mt-4 py-24 sm:py-32">
      <div className="lp-sec-content container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-12 lg:gap-16 items-start">
          {/* Left: guidance */}
          <div>
            <Reveal>
              <span className="lp-eyebrow">Contact us</span>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 className="mt-5 font-heading font-light tracking-tight text-[2rem] leading-[1.1] sm:text-5xl">
                Talk to the
                <br />
                <span className="lp-headline-accent">Growwezy team</span>
              </h2>
            </Reveal>
            <Reveal delay={0.16}>
              <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/75">
                Want to run your own branded trading platform, or see how it works first? Send us a message and tell us about your brokerage.
              </p>
            </Reveal>

            <div className="mt-8 space-y-3 max-w-md">
              <Reveal delay={0.2}>
                <Link to="/apply" className="lp-glass group flex items-center gap-4 p-4 !rounded-2xl">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#1f5bff] to-[#38d5ff] shrink-0"><Building2 className="w-5 h-5" /></span>
                  <span className="flex-1">
                    <span className="block font-medium text-[14.5px]">Become a client</span>
                    <span className="block text-[12.5px] text-white/65">Apply as a broker with your company details</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                </Link>
              </Reveal>
              <Reveal delay={0.26}>
                <a href="#contact-form" className="lp-glass group flex items-center gap-4 p-4 !rounded-2xl">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff4fa3] to-[#ff8cc8] shrink-0"><Video className="w-5 h-5" /></span>
                  <span className="flex-1">
                    <span className="block font-medium text-[14.5px]">Request a demo</span>
                    <span className="block text-[12.5px] text-white/65">Tell us what you would like to see</span>
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                </a>
              </Reveal>
              <Reveal delay={0.32}>
                <div className="lp-glass flex items-center gap-4 p-4 !rounded-2xl">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-white/15 shrink-0"><UserRound className="w-5 h-5" /></span>
                  <span className="flex-1">
                    <span className="block font-medium text-[14.5px]">Already a trader?</span>
                    <span className="block text-[12.5px] text-white/65">Sign up or log in on your own broker's website</span>
                  </span>
                </div>
              </Reveal>
            </div>
          </div>

          {/* Right: form (light card, echoing the hero panels) */}
          <Reveal delay={0.12} y={40}>
            <form id="contact-form" onSubmit={onSubmit} className="lp-panel p-6 sm:p-9 text-left scroll-mt-24">
              <h3 className="font-heading text-[22px] font-medium text-slate-900">Send us a message</h3>
              <p className="mt-1 text-[13px] text-slate-500">We'll get back to you about your platform.</p>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="c-name" className={labelClass}>Full name</label>
                  <input id="c-name" name="name" required className="lp-input" placeholder="Your name" autoComplete="name" />
                </div>
                <div>
                  <label htmlFor="c-email" className={labelClass}>Email</label>
                  <input id="c-email" name="email" type="email" required className="lp-input" placeholder="you@company.com" autoComplete="email" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="c-company" className={labelClass}>Company</label>
                  <input id="c-company" name="company" className="lp-input" placeholder="Your brokerage or company" autoComplete="organization" />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="c-message" className={labelClass}>Message</label>
                  <textarea id="c-message" name="message" required rows={5} className="lp-input resize-none" placeholder="Tell us about your brokerage and what you need" />
                </div>
              </div>

              <button type="submit" className="lp-btn-primary mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-7 py-3 text-[14px] font-semibold text-white">
                Send message <Send className="w-4 h-4" />
              </button>

              {shown && (
                <p role="status" className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-[12.5px] text-amber-800">
                  Preview only — this form isn't connected to anything yet, so your message was not sent.
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
