"use client";
import { useState } from "react";
import { inputCls } from "./ui";

// Type de contrat (CDI / CDD) + champs utiles au contrat. Date de fin et motif n'apparaissent que pour un CDD.
export default function ContractFields({ d = {} }: { d?: { contractType?: string; end?: string; motif?: string; convention?: string; essai?: string } }) {
  const [type, setType] = useState(d.contractType === "CDD" ? "CDD" : "CDI");
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-zinc-300">6. Type de contrat</p>
        <input type="hidden" name="contractType" value={type} />
        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          {["CDI", "CDD"].map((t) => <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className={`rounded-lg py-2.5 font-semibold transition ${type === t ? "bg-white text-[#0f172a] shadow-card" : "text-zinc-500"}`}>{t}</button>)}
        </div>
      </div>
      {type === "CDD" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-zinc-300">Date de fin<input name="end" type="date" required defaultValue={d.end} className={inputCls} /></label>
          <label className="block text-sm font-medium text-zinc-300">Motif du CDD<input name="motif" defaultValue={d.motif} placeholder="Ex : accroissement saisonnier" className={inputCls} /></label>
        </div>)}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-zinc-300">Convention collective <span className="font-normal text-zinc-500">(facultatif)</span><input name="convention" defaultValue={d.convention} placeholder="Ex : HCR (IDCC 1979)" className={inputCls} /></label>
        <label className="block text-sm font-medium text-zinc-300">Période d&apos;essai <span className="font-normal text-zinc-500">(facultatif)</span><input name="essai" defaultValue={d.essai} placeholder="Ex : 1 mois, ou « aucune »" className={inputCls} /></label>
      </div>
      <p className="text-xs text-zinc-500">Sans convention collective ni période d&apos;essai, le contrat reste bloqué jusqu&apos;à ce que tu les complètes.</p>
    </div>
  );
}
