import { Icon } from "./icons";
// Marque : toque blanche sur carré vert + « Gesto ».
export function Mark({ size = 30 }: { size?: number }) {
  return <span style={{ width: size, height: size }} className="inline-flex items-center justify-center rounded-[9px] bg-gradient-to-b from-[#25b157] to-[#1a8b43] text-white shadow-green"><Icon name="chefHat" className="h-[60%] w-[60%]" /></span>;
}
export function Logo({ light = false }: { light?: boolean }) {
  return <span className={`inline-flex items-center gap-2.5 text-[21px] font-bold tracking-tight ${light ? "text-white" : "text-[#0f172a]"}`}><Mark />Gesto</span>;
}
export function Avatar({ name, size = 44, dark = false }: { name: string; size?: number; dark?: boolean }) {
  const ini = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "G";
  return <span style={{ width: size, height: size, fontSize: size * 0.36 }} className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${dark ? "bg-white/15 text-white ring-2 ring-white/25" : "bg-green-100 text-green-700 ring-4 ring-white"}`}>{ini}</span>;
}
