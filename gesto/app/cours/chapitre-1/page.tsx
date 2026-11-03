import Link from "next/link";

export const metadata = { title: "Chapitre 1 — Embaucher sans oublier la paperasse" };
const steps: [string, string][] = [
  ["Avant l'embauche : la DPAE", "La déclaration préalable à l'embauche se fait auprès de l'URSSAF, avant l'arrivée du salarié (jusqu'à 8 jours avant). C'est toi qui la fais, sur urssaf.fr ou net-entreprises.fr. Garde l'accusé de réception."],
  ["Le contrat écrit", "Un CDD doit être écrit, avec son motif, et remis au salarié dans les 2 jours ouvrables suivant l'embauche. Un CDI peut être verbal en principe, mais l'écrit te protège et la convention collective l'impose souvent."],
  ["Les horaires et le temps de travail", "Tu dois pouvoir prouver les heures réalisées : horaires affichés ou fiches horaires signées. C'est le premier point regardé en cas de contrôle."],
  ["Le registre unique du personnel", "Chaque salarié y est inscrit dès son entrée : identité, poste, dates d'entrée et de sortie."],
  ["Mutuelle et médecine du travail", "L'affiliation à la mutuelle d'entreprise est obligatoire, et une visite d'information et de prévention doit être planifiée après l'embauche."],
  ["Les échéances qui font perdre de l'argent", "Fin de CDD, visites médicales, renouvellements : une date oubliée coûte plus cher que le temps d'un rappel."],
];
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-10">
      <p className="text-sm text-accent">Chapitre 1 · gratuit · sans carte bancaire</p>
      <h1 className="mt-1 text-3xl font-bold">Embaucher sans oublier la paperasse</h1>
      <p className="mt-3 text-zinc-300">Six réflexes à avoir pour chaque nouveau salarié. Simple, dans l&apos;ordre, et utile même sans Gesto.</p>
      <ol className="mt-8 space-y-4">{steps.map(([t, d], i) => (
        <li key={t} className="rounded-2xl border border-line bg-panel p-5"><h2 className="font-semibold"><span className="mr-2 text-accent">{i + 1}.</span>{t}</h2><p className="mt-2 text-sm text-zinc-400">{d}</p></li>))}</ol>
      <p className="mt-4 text-xs text-zinc-500">Contenu pédagogique général, à vérifier selon ta convention collective. Ce n&apos;est pas un conseil juridique.</p>
      <aside className="mt-8 rounded-2xl border border-accent/40 bg-panel p-6">
        <h2 className="text-xl font-bold">Ce que je viens de t&apos;apprendre, Gesto peut le faire pour toi</h2>
        <p className="mt-2 text-sm text-zinc-400">Gesto prépare le contrat, la fiche horaire et la checklist DPAE en 30 secondes, tu relis et valides, et il te rappelle tes échéances. Gesto ne déclare rien à ta place.</p>
        <Link href="/inscription" className="mt-4 inline-block rounded-xl bg-accent px-5 py-3 font-semibold text-black">Créer mon compte</Link>
      </aside>
    </main>
  );
}
