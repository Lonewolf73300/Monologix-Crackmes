import Link from "next/link";
import { Chip, Icon, type IconName } from "./icons";

export type Tone = "rouge" | "orange" | "vert" | "bleu";
const T: Record<Tone, { row: string; label: string; icon: IconName }> = {
  rouge: { row: "bg-red-50/80 hover:bg-red-50", label: "text-red-600", icon: "alert" },
  orange: { row: "bg-amber-50/80 hover:bg-amber-50", label: "text-amber-600", icon: "clock" },
  vert: { row: "bg-green-50/80 hover:bg-green-50", label: "text-green-700", icon: "checkCircle" },
  bleu: { row: "bg-blue-50/80 hover:bg-blue-50", label: "text-blue-600", icon: "info" },
};
// Ligne de situation (style « Mode Focus ») : rouge = urgent, orange = à traiter, vert = OK, bleu = information.
export function Tile({ tone, label, title, meta, href, action, icon }: { tone: Tone; label: string; title: string; meta?: string; href?: string; action?: string; icon?: IconName; variant?: string }) {
  const t = T[tone];
  const body = (
    <div className={`flex items-center gap-4 rounded-xl px-4 py-3.5 transition-colors ${t.row}`}>
      <Chip name={icon ?? t.icon} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-wider ${t.label}`}>{label}</p>
        <p className="font-semibold leading-snug text-[#0f172a]">{title}</p>
        {meta && <p className="mt-0.5 text-sm text-zinc-500">{meta}</p>}
      </div>
      {href && <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-zinc-500">{action && <span className="hidden sm:inline">{action}</span>}<Icon name="chevronRight" className="h-5 w-5" /></span>}
    </div>
  );
  return href ? <Link href={href} className="block">{body}</Link> : body;
}
