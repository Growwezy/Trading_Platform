import { useNavigate } from "react-router-dom";
import LandingNav from "@/components/landing/LandingNav";
import LandingHero from "@/components/landing/LandingHero";
import FlowBackdrop from "@/components/landing/FlowBackdrop";
import AboutSection from "@/components/landing/AboutSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import BrokerJourneySection from "@/components/landing/BrokerJourneySection";
import ContactSection from "@/components/landing/ContactSection";
import SiteFooter from "@/components/landing/SiteFooter";

// Master website — page 1: Landing Page (docs/roles/SUPERADMIN.md).
// Sections: hero → about → features → start your broker journey → contact → footer.
// About → Contact share one continuous background (.lp-flow) and one particle layer, and the
// hero fades into it, so there are no visible lines between sections.
// The nav sits outside the sections so it stays on top while scrolling.
// "Become a Broker" goes to the client application route (/apply).
const Landing = () => {
  const navigate = useNavigate();
  return (
    <>
      <LandingNav />
      <main>
        <LandingHero onOpenForm={() => navigate("/apply")} />
        <div className="lp-flow">
          <FlowBackdrop />
          <AboutSection />
          <FeaturesSection />
          <BrokerJourneySection />
          <ContactSection />
        </div>
      </main>
      <SiteFooter />
    </>
  );
};

export default Landing;
