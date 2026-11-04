import { Link } from "react-router-dom";

const explore = [
  { label: "Home", href: "#top" },
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Contact", href: "#contact" },
];

const linkClass = "text-[13.5px] text-white/65 hover:text-white transition-colors";

const SiteFooter = () => (
  <footer className="lp-root lp-sec lp-sec-footer pt-16 sm:pt-20">
    <div className="lp-sec-content container mx-auto px-4 sm:px-6">
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <a href="#top" aria-label="Growwezy home">
            <img src="/images/Groww HL.png" alt="Growwezy" className="h-10 w-auto" />
          </a>
          <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/60">
            One central product. Separate broker workspaces. Individual trader accounts.
          </p>
        </div>

        <nav aria-label="Explore">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-4">Explore</p>
          <ul className="space-y-3">
            {explore.map((l) => (
              <li key={l.label}>
                <a href={l.href} className={linkClass}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Get started">
          <p className="text-[11px] uppercase tracking-[0.14em] text-white/45 mb-4">Get started</p>
          <ul className="space-y-3">
            <li><Link to="/apply" className={linkClass}>Become a Broker</Link></li>
            <li><a href="#contact" className={linkClass}>Request a Demo</a></li>
          </ul>
        </nav>
      </div>

      <div className="mt-14 border-t border-white/10 py-6 text-[12.5px] text-white/45">
        © {new Date().getFullYear()} Growwezy. All rights reserved.
      </div>
    </div>

    {/* large faded wordmark */}
    <div className="lp-wordmark font-heading font-semibold text-center whitespace-nowrap overflow-hidden pb-2" aria-hidden="true">
      GROWWEZY
    </div>
  </footer>
);

export default SiteFooter;
