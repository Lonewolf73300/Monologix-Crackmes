"use client";
import { useEffect, useState } from "react";

type Fields = { name: string; post: string; start: string; hours: string; salary: string; contractType: string; end: string; convention: string; essai: string; motif: string };
const empty: Fields = { name: "", post: "", start: "", hours: "", salary: "", contractType: "CDI", end: "", convention: "", essai: "", motif: "" };

export default function DraftPreview() {
  const [f, setF] = useState<Fields>(empty);
  useEffect(() => {
    const form = document.getElementById("fiche-form");
    if (!form) return;
    const read = () => {
      const fd = new FormData(form as HTMLFormElement);
      const next = { ...empty };
      (Object.keys(empty) as (keyof Fields)[]).forEach((k) => { next[k] = String(fd.get(k) ?? ""); });
      setF(next);
    };
    read();
    form.addEventListener("input", read);
    form.addEventListener("change", read);
    const later = () => setTimeout(read, 0);
    form.addEventListener("click", later);
    return () => { form.removeEventListener("input", read); form.removeEventListener("change", read); form.removeEventListener("click", later); };
  }, []);
  const flags = [
    "Identité juridique de l'employeur (raison sociale, SIREN, adresse) : à compléter. Gesto ne l'invente pas.",
    f.convention.trim() ? `Convention collective saisie (« ${f.convention.trim()} ») : à vérifier sur le texte officiel.` : "Convention collective : manquante. À vérifier avant de valider.",
    f.essai.trim() ? `Période d'essai saisie (« ${f.essai.trim()} ») : durée à vérifier.` : "Période d'essai : manquante (écris « aucune » s'il n'y en a pas).",
    f.contractType === "CDD" && !f.motif.trim() ? "Motif du CDD : manquant. Un CDD sans motif autorisé est à faire vérifier." : "",
    f.contractType === "CDD" && !f.end ? "Date de fin du CDD : manquante." : "",
  ].filter(Boolean);
  return (
    <aside className="mt-5 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
      <p className="text-base font-bold">Brouillon — ce n&apos;est pas un contrat à signer</p>
      <p className="mt-1">Générer les documents le passe au statut « À relire ». Seul toi peux ensuite le marquer « Validé par le patron ». Même validé, il reste à faire relire avant toute signature.</p>
      <ul className="mt-3 list-disc space-y-1 pl-5">{flags.map((x) => <li key={x}>{x}</li>)}</ul>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white p-4 font-sans text-[13px] leading-relaxed text-zinc-700">{`BROUILLON
${f.name || "[Nom du salarié]"} — ${f.post || "[Poste]"}
${f.contractType}${f.contractType === "CDD" && f.end ? ` jusqu'au ${f.end}` : ""}
Début : ${f.start || "[date]"} · ${f.hours || "[heures]"} h/semaine · brut ${f.salary || "[salaire]"} €
Convention : ${f.convention || "[À COMPLÉTER]"}
Période d'essai : ${f.essai || "[À COMPLÉTER]"}
${f.contractType === "CDD" ? `Motif : ${f.motif || "[À COMPLÉTER]"}` : ""}
Employeur : [À COMPLÉTER — SIREN non renseigné]`}</pre>
    </aside>
  );
}
