"use client";
import { useState } from "react";
import { saveDiagnostic } from "../actions";
import { TYPES, NB, SEASONS, PAINS, OBJECTIVES } from "@/lib/rules";

const big = "w-full rounded-xl border border-line bg-panel px-5 py-4 text-left text-lg";
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
      <p className="text-sm text-zinc-500">Question {step + 1} sur {titles.length}</p>
      <h1 className="mt-1 text-2xl font-bold">{titles[step]}</h1>
      <div className="mt-6 space-y-3">
        {step === 0 && <><input className={big} placeholder="Nom du commerce" value={d.name} onChange={(e) => set("name", e.target.value)} /><button disabled={!d.name.trim()} onClick={next} className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white disabled:opacity-40">Continuer</button></>}
        {step === 1 && <><input className={big} placeholder="Ex : 73" value={d.dept} onChange={(e) => set("dept", e.target.value)} inputMode="numeric" /><button disabled={!d.dept.trim()} onClick={next} className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white disabled:opacity-40">Continuer</button></>}
        {step === 2 && TYPES.map((t) => <Opt key={t} k="type" v={t} />)}
        {step === 3 && NB.map((t) => <Opt key={t} k="nb_sal" v={t} />)}
        {step === 4 && SEASONS.map((t) => <Opt key={t} k="season" v={t} />)}
        {step === 5 && <>
          {PAINS.map((p) => { const on = d.pains.includes(p); return <button key={p} type="button" aria-pressed={on} className={big + (on ? " border-accent" : "")} onClick={() => setD((x) => ({ ...x, pains: on ? x.pains.filter((q) => q !== p) : [...x.pains, p] }))}>{on ? "✓ " : ""}{p}</button>; })}
          <button onClick={next} className="w-full rounded-xl bg-accent px-6 py-4 text-lg font-semibold text-white">Continuer</button></>}
        {step === 6 && OBJECTIVES.map((o) => <button key={o} disabled={busy} type="button" className={big} onClick={async () => { setBusy(true); await saveDiagnostic({ ...d, objective: o }); }}>{o}</button>)}
      </div>
      {step > 0 && <button onClick={() => setStep(step - 1)} className="mt-6 text-sm text-zinc-500 underline">Retour</button>}
    </div>
  );
}
