// Marque Gesto : signe « coche » (document validé) + mot-symbole ; motif de courbes de niveau (la montagne, sans illustration).
export function Mark({ size = 22, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <rect width="24" height="24" rx="6" fill="#1f5a43" />
      <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-[19px] font-semibold tracking-tight ${light ? "text-white" : "text-[#141414]"}`}>
      <Mark />gesto
    </span>
  );
}
export function Avatar({ name, size = 36, dark = false }: { name: string; size?: number; dark?: boolean }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "G";
  return <span style={{ width: size, height: size }} className={`inline-flex shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${dark ? "bg-white/10 text-white" : "bg-[#ebe9e3] text-zinc-300"}`}>{ini}</span>;
}

// Courbes de niveau générées (déterministes) : anneaux déformés autour d'un sommet.
function ring(cx: number, cy: number, r: number, k: number) {
  const pts: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const rr = r * (1 + 0.13 * Math.sin(3 * a + k * 0.35) + 0.07 * Math.sin(5 * a - k * 0.5) + 0.03 * Math.sin(9 * a + k));
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * 0.72 * Math.sin(a)).toFixed(1)}`);
  }
  return "M" + pts.join("L") + "Z";
}
export function Contours({ className = "", stroke = "#ffffff", opacity = 0.09, cx = 620, cy = 140 }: { className?: string; stroke?: string; opacity?: number; cx?: number; cy?: number }) {
  return (
    <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden>
      <g fill="none" stroke={stroke} strokeOpacity={opacity} strokeWidth="1">
        {Array.from({ length: 18 }, (_, k) => <path key={k} d={ring(cx, cy, 18 + k * 26, k)} />)}
      </g>
    </svg>
  );
}
