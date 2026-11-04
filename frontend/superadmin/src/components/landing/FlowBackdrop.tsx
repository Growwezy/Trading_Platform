/* One continuous particle layer behind every section (About → Contact), so the dots never
   stop at a section boundary. Same orbiting speckle as the hero, dense at the sides. */
const FlowBackdrop = () => (
  <div className="lp-particles lp-particles-flow" aria-hidden="true">
    <div className="lp-mask-flow">
      <div className="lp-speck lp-speck-a" />
    </div>
  </div>
);

export default FlowBackdrop;
