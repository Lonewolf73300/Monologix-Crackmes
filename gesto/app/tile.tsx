import Link from "next/link";

export type Tone = "rouge" | "orange" | "vert" | "bleu";
const TONES: Record<Tone, { box: string; label: string; icon: string }> = {
  rouge: { box: "border-red-200 bg-red-50", label: "text-bad", icon: "!" },
  orange: { box: "border-amber-200 bg-amber-50", label: "text-warn", icon: "◷" },
  vert: { box: "border-green-200 bg-green-50", label: "text-ok", icon: "✓" },
  bleu: { box: "border-blue-200 bg-blue-50", label: "text-info", icon: "i" },
};
// Tuile de statut : rouge = problème immédiat, orange = à traiter, vert = OK, bleu = information.
export function Tile({ tone, label, title, href, action }: { tone: Tone; label: string; title: string; href?: string; action?: string }) {
  const t = TONES[tone];
  const body = (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 ${t.box}`}>
      <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-current bg-white text-lg font-bold ${t.label}`}>{t.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-xs font-semibold uppercase tracking-wide ${t.label}`}>{label}</p>
        <p className="font-semibold text-slate-900">{title}</p>
      </div>
      {href && <span className="shrink-0 text-sm font-medium text-slate-600">{action ?? "Ouvrir"} ›</span>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}
