import { useState } from "react";
import { Menu, X } from "lucide-react";

// All links scroll to a section of the landing page.
const navLinks = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

const linkClass =
  "lp-nav-link px-5 py-2 rounded-full text-[13.5px] text-white/80 hover:text-white";

const LandingNav = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-8 pt-3">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
        {/* Logo */}
        <a href="#top" className="flex items-center shrink-0" aria-label="Home">
          <img
            src="/images/Groww HL.png"
            alt="Growwezy"
            className="h-8 sm:h-9 w-auto drop-shadow-[0_4px_14px_rgba(0,0,0,0.35)]"
          />
        </a>

        {/* Desktop pill */}
        <nav className="lp-nav-pill hidden md:flex items-center gap-1.5 rounded-full p-1.5" aria-label="Primary">
          {navLinks.map((l) => (
            <a key={l.label} href={l.href} className={linkClass}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href="#contact"
            className="lp-btn-ghost hidden sm:inline-flex rounded-full px-5 py-2 text-[13px] font-medium text-white"
          >
            Request Demo
          </a>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            className="lp-nav-pill md:hidden rounded-full p-2 text-white"
          >
            {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="lp-nav-pill md:hidden mx-auto max-w-6xl mt-3 rounded-2xl p-2 flex flex-col">
          {navLinks.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-4 py-3 rounded-xl text-sm text-slate-100 hover:bg-white/10"
            >
              {l.label}
            </a>
          ))}
          <a href="#contact" onClick={() => setOpen(false)} className="btn-glow mt-1 rounded-xl px-4 py-3 text-center text-sm">
            Request Demo
          </a>
        </div>
      )}
    </header>
  );
};

export default LandingNav;
