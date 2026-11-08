"use client";
import { useState } from "react";
import { saveDiagnostic } from "../actions";
import { TYPES, NB, SEASONS, PAINS, OBJECTIVES } from "@/lib/rules";

const big = "w-full rounded-lg border border-line bg-panel px-5 py-4 text-left text-lg transition hover:border-zinc-400";
export default function Wizard() {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({ name: "", type: "", dept: "", nb_sal: "", season: "", pains: [] as string[], objective: "" });
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setD((x) => ({ ...x, [k]: v }));
  const next = () => setStep((s) => s + 1);
  const pick = (k: string, v: string) => { set(k, v); next(); };
  const Opt = ({ k, v }: { k: string; v: string }) => <button type="button" className={big} onClick={() => pick(k, v)}>{v}</button>;
  const titles = ["Comment s'appelle ton commerce ?", "Dans quel département ?", "Quel type de commerce ?", "Combien de salariés ?", "Ton activité est…", "Tes douleurs concrètes (plusieurs choix)", "Ton objectif prioritaire"];
  return (
    <div>
      <div className="flex items-center justify-between"><p className="eyebrow">Question {step + 1} / {titles.length}</p></div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${((step + 1) / titles.length) * 100}%` }} /></div>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{titles[step]}</h1>
      <div className="mt-6 space-y-3">
        {step === 0 && <><input className={big} placeholder="Nom du commerce" value={d.name} onChange={(e) => set("name", e.target.value)} /><button disabled={!d.name.trim()} onClick={next} className="w-full btn-primary w-full py-4 text-base disabled:opacity-40">Continuer</button></>}
        {step === 1 && <><input className={big} placeholder="Ex : 73" value={d.dept} onChange={(e) => set("dept", e.target.value)} inputMode="numeric" /><button disabled={!d.dept.trim()} onClick={next} className="w-full btn-primary w-full py-4 text-base disabled:opacity-40">Continuer</button></>}
        {step === 2 && TYPES.map((t) => <Opt key={t} k="type" v={t} />)}
        {step === 3 && NB.map((t) => <Opt key={t} k="nb_sal" v={t} />)}
        {step === 4 && SEASONS.map((t) => <Opt key={t} k="season" v={t} />)}
        {step === 5 && <>
          {PAINS.map((p) => { const on = d.pains.includes(p); return <button key={p} type="button" aria-pressed={on} className={big + (on ? " border-accent bg-[#eef4f1]" : "")} onClick={() => setD((x) => ({ ...x, pains: on ? x.pains.filter((q) => q !== p) : [...x.pains, p] }))}>{on ? "✓ " : ""}{p}</button>; })}
          <button onClick={next} className="w-full rounded-lg bg-accent px-6 py-4 text-lg font-semibold text-white">Continuer</button></>}
        {step === 6 && OBJECTIVES.map((o) => <button key={o} disabled={busy} type="button" className={big} onClick={async () => { setBusy(true); await saveDiagnostic({ ...d, objective: o }); }}>{o}</button>)}
      </div>
      {step > 0 && <button onClick={() => setStep(step - 1)} className="mt-6 text-sm text-zinc-500 underline">Retour</button>}
    </div>
  );
}
