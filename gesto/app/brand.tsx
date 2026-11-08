// Éléments de marque : logo toque, bannière montagne/chalet (illustration SVG maison), avatar initiales.
export function Toque({ className = "h-7 w-7", color = "currentColor" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 30c-5 0-8-3-8-7s3-7 8-7c1-4 5-7 10-7s9 3 10 7c5 0 8 3 8 7s-3 7-8 7" />
      <path d="M14 30v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9M14 35h20" />
    </svg>
  );
}
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-2xl font-bold tracking-tight ${light ? "text-white" : "text-slate-900"}`}>
      <Toque className="h-8 w-8" color={light ? "#fff" : "#16a34a"} />Gesto
    </span>
  );
}
export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "G";
  return <span style={{ width: size, height: size }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-green-100 font-bold text-green-700">{ini}</span>;
}
export function Hero({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 320" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1e3a5f" /><stop offset=".55" stopColor="#6d8fb5" /><stop offset="1" stopColor="#f0b27a" /></linearGradient>
        <linearGradient id="snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#c9d6e6" /></linearGradient>
      </defs>
      <rect width="800" height="320" fill="url(#sky)" />
      <path d="M0 210 L120 110 L190 160 L300 60 L420 175 L520 95 L650 185 L720 130 L800 200 L800 320 L0 320Z" fill="#8aa4c2" />
      <path d="M300 60 L270 98 L292 92 L306 108 L322 90 L345 102Z M520 95 L495 126 L512 120 L526 134 L542 118 L560 126Z M120 110 L98 136 L116 132 L130 142 L146 128Z" fill="url(#snow)" />
      <path d="M0 245 Q200 205 400 240 T800 225 L800 320 L0 320Z" fill="#eef3f9" />
      <g fill="#1f4d3a">{[60, 95, 700, 740, 770].map((x, i) => <path key={x} d={`M${x} ${262 - i % 2 * 6} l16 -46 l16 46z M${x + 2} ${240 - i % 2 * 6} l14 -40 l14 40z`} />)}</g>
      <g transform="translate(470 195)">
        <path d="M0 70 V30 L70 -5 L140 30 V70Z" fill="#6b4226" />
        <path d="M-12 32 L70 -14 L152 32 L146 38 L70 -2 L-6 38Z" fill="#3b2415" />
        <rect x="14" y="38" width="22" height="20" fill="#ffd27a" /><rect x="52" y="38" width="22" height="20" fill="#ffd27a" /><rect x="96" y="38" width="22" height="20" fill="#ffd27a" />
        <path d="M70 -22 l9 0 l0 10 l-9 0z" fill="#d4a24c" />
      </g>
    </svg>
  );
}
