import { Icon } from "./icons";
// Marque : toque + « Gesto » (maquettes 1 et 2) ; variante « Gesto MANAGEMENT » dorée pour la barre latérale (maquette 3).
export function Mark({ size = 34 }: { size?: number }) {
  return <span style={{ width: size, height: size }} className="inline-flex items-center justify-center rounded-[10px] bg-gradient-to-br from-[#2bc06a] to-[#12a07a] text-white shadow-green"><Icon name="chefHat" className="h-[60%] w-[60%]" /></span>;
}
export function Logo({ light = false }: { light?: boolean }) {
  return <span className={`inline-flex items-center gap-2.5 text-[26px] font-bold tracking-tight ${light ? "text-white" : "text-[#0f172a]"}`}><Mark />Gesto</span>;
}
export function SideLogo() {
  return (
    <span className="flex flex-col items-center text-white">
      <Icon name="chefHat" className="h-12 w-12 text-gold" />
      <span className="mt-1 text-[40px] font-bold leading-none tracking-tight">Gesto</span>
      <span className="mt-1.5 text-[11px] font-medium tracking-[0.42em] text-white/85">MANAGEMENT</span>
      <svg viewBox="0 0 120 10" className="mt-1 h-2.5 w-28 text-gold" aria-hidden><path d="M4 3 Q60 12 116 3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
    </span>
  );
}
export function Avatar({ name, src, size = 44, dark = false }: { name: string; src?: string | null; size?: number; dark?: boolean }) {
  if (src) return <img src={src} alt="" style={{ width: size, height: size }} className={`shrink-0 rounded-full object-cover ${dark ? "ring-2 ring-white/25" : "ring-4 ring-white shadow-card"}`} />;
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "G";
  return <span style={{ width: size, height: size, fontSize: size * 0.36 }} className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${dark ? "bg-white/15 text-white ring-2 ring-white/25" : "bg-green-100 text-green-700 ring-4 ring-white"}`}>{ini}</span>;
}
