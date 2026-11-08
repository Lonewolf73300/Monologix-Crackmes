import { Chip, type ChipTone, type IconName } from "./icons";

// En-tête de page commun (style maquettes).
export function PageHeader({ icon, tone = "vert", title, sub, action }: { icon: IconName; tone?: ChipTone; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-4">
        <Chip name={icon} tone={tone} size="lg" />
        <div className="min-w-0"><h1 className="text-[28px] font-bold leading-tight tracking-tight lg:text-[32px]">{title}</h1>{sub && <p className="text-zinc-500">{sub}</p>}</div>
      </div>
      {action}
    </header>
  );
}
const PILL: Record<string, string> = { vert: "bg-green-100 text-green-700", orange: "bg-amber-100 text-amber-700", rouge: "bg-red-100 text-red-700", bleu: "bg-blue-100 text-blue-700", gris: "bg-slate-100 text-slate-600" };
export function Pill({ tone, children }: { tone: keyof typeof PILL; children: React.ReactNode }) {
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${PILL[tone]}`}>{children}</span>;
}
