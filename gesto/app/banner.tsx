// Bannière : la photo envoyée par le commerce (Paramètres), sinon une scène « montagne au crépuscule ».
export function Banner({ className = "", src }: { className?: string; src?: string | null }) {
  if (src) return <img src={src} alt="" className={`${className} object-cover`} />;
  const lights = [[700, 352], [716, 348], [731, 356], [748, 350], [762, 357], [690, 361], [779, 362], [805, 358], [822, 364], [660, 368], [842, 370]];
  return (
    <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="g-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b1322" /><stop offset=".45" stopColor="#1f3a5f" /><stop offset=".8" stopColor="#8a6a5c" /><stop offset="1" stopColor="#d9935a" /></linearGradient>
        <radialGradient id="g-glow" cx=".72" cy=".9" r=".55"><stop offset="0" stopColor="#ffb86b" stopOpacity=".55" /><stop offset="1" stopColor="#ffb86b" stopOpacity="0" /></radialGradient>
        <linearGradient id="g-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fb3cc" /><stop offset=".35" stopColor="#5f7899" /><stop offset="1" stopColor="#3a5274" /></linearGradient>
        <linearGradient id="g-mid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c4466" /><stop offset="1" stopColor="#1b2b44" /></linearGradient>
        <linearGradient id="g-near" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#152238" /><stop offset="1" stopColor="#0b1322" /></linearGradient>
      </defs>
      <rect width="1200" height="420" fill="url(#g-sky)" />
      <rect width="1200" height="420" fill="url(#g-glow)" />
      <path d="M0 250 L90 205 L170 228 L260 150 L330 190 L420 95 L470 130 L540 110 L610 170 L700 120 L790 185 L880 140 L960 200 L1050 160 L1130 210 L1200 185 V420 H0Z" fill="url(#g-far)" opacity=".95" />
      <path d="M420 95 L395 128 L412 124 L428 136 L446 120 L470 130Z M700 120 L680 146 L698 141 L712 151 L726 140Z M260 150 L244 172 L258 168 L272 176Z" fill="#e8eef6" opacity=".85" />
      <path d="M0 300 L120 255 L220 280 L330 230 L450 285 L560 245 L680 290 L800 250 L930 300 L1050 262 L1200 300 V420 H0Z" fill="url(#g-mid)" />
      <path d="M0 360 Q180 320 380 352 T760 344 T1200 350 V420 H0Z" fill="url(#g-near)" />
      <g fill="#ffcf7a">{lights.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 ? 1.6 : 2.2} opacity={0.75 + (i % 2) * 0.2} />)}</g>
    </svg>
  );
}
