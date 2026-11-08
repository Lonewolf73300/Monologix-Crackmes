import Link from "next/link";

export type Tone = "rouge" | "orange" | "vert" | "bleu";
const TONE: Record<Tone, { bar: string; text: string }> = {
  rouge: { bar: "bg-bad", text: "text-bad" },
  orange: { bar: "bg-warn", text: "text-warn" },
  vert: { bar: "bg-ok", text: "text-ok" },
  bleu: { bar: "bg-info", text: "text-info" },
};
// Ligne de statut : rouge = problème immédiat, orange = à traiter, vert = OK, bleu = information.
// variant "row" : sans cadre, pour être empilée dans une carte à filets.
export function Tile({ tone, label, title, meta, href, action, variant = "card" }: { tone: Tone; label: string; title: string; meta?: string; href?: string; action?: string; variant?: "card" | "row" }) {
  const t = TONE[tone];
  const body = (
    <div className={`group relative flex items-center gap-4 ${variant === "card" ? "card overflow-hidden py-4 pl-5 pr-4" : "py-4 pl-5 pr-4 transition-colors hover:bg-[#faf9f6]"}`}>
      <span aria-hidden className={`absolute inset-y-3 left-0 w-[3px] rounded-r ${t.bar}`} />
      <div className="min-w-0 flex-1">
        <p className={`font-mono text-[11px] font-medium uppercase tracking-label ${t.text}`}>{label}</p>
        <p className="mt-0.5 font-medium text-[#141414]">{title}</p>
        {meta && <p className="mt-0.5 font-mono text-xs text-zinc-500">{meta}</p>}
      </div>
      {href && <span className="shrink-0 text-sm font-medium text-zinc-400 transition-colors group-hover:text-[#141414]">{action ?? "Ouvrir"} →</span>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}
