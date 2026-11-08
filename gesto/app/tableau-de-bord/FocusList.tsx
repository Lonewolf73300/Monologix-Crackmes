"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Chip, Icon, type ChipTone, type IconName } from "../icons";

export type Row = { key: string; tone: ChipTone; label: string; title: string; href?: string; icon: IconName };
const BG: Record<string, string> = { vert: "bg-green-50 hover:bg-green-100/70", rouge: "bg-red-50 hover:bg-red-100/70", orange: "bg-amber-50 hover:bg-amber-100/70", bleu: "bg-blue-50 hover:bg-blue-100/70", gris: "bg-slate-50", or: "bg-amber-50" };
const TX: Record<string, string> = { vert: "text-green-700", rouge: "text-red-600", orange: "text-amber-600", bleu: "text-blue-700", gris: "text-slate-600", or: "text-amber-700" };

// Mode Focus (maquette 1) : activé = les 3 priorités seulement ; désactivé = tout. Choix mémorisé sur l'appareil.
export default function FocusList({ rows }: { rows: Row[] }) {
  const [focus, setFocus] = useState(true);
  useEffect(() => { try { if (localStorage.getItem("gesto-focus") === "0") setFocus(false); } catch {} }, []);
  const toggle = () => { const v = !focus; setFocus(v); try { localStorage.setItem("gesto-focus", v ? "1" : "0"); } catch {} };
  const shown = focus ? rows.slice(0, 3) : rows;
  return (
    <section className="overflow-hidden rounded-[22px] border border-line bg-white shadow-card">
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50/40 px-5 py-4">
        <div className="flex items-center gap-3">
          <Icon name="target" className="h-8 w-8 text-blue-600" />
          <h2 className="text-[22px] font-bold tracking-tight">Mode Focus</h2>
          <span title="Activé : seulement les 3 priorités. Désactivé : tout ce qui est à traiter." className="text-zinc-500"><Icon name="info" className="h-5 w-5" /></span>
        </div>
        <button role="switch" aria-checked={focus} aria-label="Mode Focus" onClick={toggle} className={`relative h-8 w-14 rounded-full transition-colors ${focus ? "bg-blue-600" : "bg-slate-300"}`}>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${focus ? "left-7" : "left-1"}`} />
        </button>
      </div>
      <div className="space-y-2 p-3">
        {shown.map((r) => {
          const body = (
            <div className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-colors ${BG[r.tone]}`}>
              <Chip name={r.icon} tone={r.tone} />
              <div className="min-w-0 flex-1"><p className={`text-[13px] font-bold uppercase tracking-wide ${TX[r.tone]}`}>{r.label}</p><p className="text-[17px] font-semibold leading-snug text-[#0f172a]">{r.title}</p></div>
              {r.href && <Icon name="chevronRight" className="h-6 w-6 shrink-0 text-zinc-500" />}
            </div>);
          return r.href ? <Link key={r.key} href={r.href} className="block">{body}</Link> : <div key={r.key}>{body}</div>;
        })}
        {focus && rows.length > 3 && <button onClick={toggle} className="w-full rounded-xl py-2 text-sm font-semibold text-blue-600 hover:bg-blue-50">{rows.length - 3 === 1 ? "Voir 1 autre point" : `Voir les ${rows.length - 3} autres points`}</button>}
      </div>
    </section>
  );
}
