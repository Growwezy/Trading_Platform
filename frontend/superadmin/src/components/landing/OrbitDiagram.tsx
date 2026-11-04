/* Orbit diagram: Growwezy (hub) → brokers (inner ring) → traders (outer ring). Slowly rotating. */
const C = 260; // svg centre
const R_BROKER = 118;
const R_TRADER = 205;
const brokerAngles = [-90, 30, 150];
const traderOffsets = [-22, 0, 22];

const pt = (r: number, deg: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
};

const OrbitDiagram = () => (
  <div className="relative mx-auto w-full max-w-[500px] aspect-square">
    {/* soft glow behind the diagram */}
    <div className="absolute inset-[8%] rounded-full bg-[radial-gradient(closest-side,rgba(60,130,255,0.55),transparent_75%)] blur-2xl" aria-hidden="true" />

    <svg viewBox="0 0 520 520" className="relative w-full h-full" role="img" aria-label="Growwezy at the centre, connected to brokers, each connected to their traders">
      <defs>
        <radialGradient id="lp-broker" cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#9fe8ff" />
          <stop offset="1" stopColor="#1f5bff" />
        </radialGradient>
      </defs>

      {/* fixed outer ring */}
      <circle cx={C} cy={C} r="248" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

      <g className="lp-spin">
        <circle cx={C} cy={C} r={R_BROKER} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="3 7" />
        <circle cx={C} cy={C} r={R_TRADER} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="1" strokeDasharray="3 7" />

        {brokerAngles.map((ba) => {
          const b = pt(R_BROKER, ba);
          return (
            <g key={ba}>
              {/* hub → broker */}
              <line x1={C} y1={C} x2={b.x} y2={b.y} stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
              {/* broker → its traders */}
              {traderOffsets.map((o) => {
                const t = pt(R_TRADER, ba + o);
                return (
                  <g key={o}>
                    <line x1={b.x} y1={b.y} x2={t.x} y2={t.y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <circle cx={t.x} cy={t.y} r="7" fill="#d7f3ff" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
                  </g>
                );
              })}
              <circle cx={b.x} cy={b.y} r="26" fill="rgba(47,107,255,0.25)" />
              <circle cx={b.x} cy={b.y} r="17" fill="url(#lp-broker)" stroke="rgba(255,255,255,0.8)" strokeWidth="1.6" />
            </g>
          );
        })}
      </g>
    </svg>

    {/* hub (not rotating) */}
    <div className="lp-hub absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid place-items-center w-[22%] aspect-square rounded-full text-center">
      <div>
        <p className="font-heading text-[11px] sm:text-[13px] font-semibold tracking-[0.12em] uppercase">Growwezy</p>
        <p className="text-[8px] sm:text-[10px] text-white/80 leading-tight mt-0.5">Central platform</p>
      </div>
    </div>
  </div>
);

export default OrbitDiagram;
