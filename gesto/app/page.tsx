import Link from "next/link";
import { extras } from "@/lib/flags";

const proofs = [
  ["Un document en 30 secondes", "Six questions, et le contrat, la fiche horaire et la checklist DPAE sont prêts à relire."],
  ["Zéro oubli", "Gesto suit tes échéances et te rappelle à la bonne date. 2 notifications par semaine maximum."],
  ["Toi qui valides", "Rien n'est utilisable sans ta validation explicite, horodatée dans un journal."],
];
const steps = ["Tu réponds à une dizaine de questions", "Gesto règle ton tableau de bord", "Tu relis, tu valides, tu télécharges"];

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <section className="py-12">
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">Ta paperasse, <span className="text-accent">c&apos;est fini.</span></h1>
        <p className="mt-4 text-lg text-zinc-300">Gesto enlève la paperasse aux commerçants et restaurateurs, et t&apos;évite les oublis.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/cours/chapitre-1" className="rounded-xl bg-accent px-6 py-4 text-center text-lg font-semibold text-black">Je veux comprendre</Link>
          <Link href="/inscription" className="rounded-xl border border-line px-6 py-4 text-center text-lg font-semibold">Fais-le pour moi</Link>
        </div>
        <p className="mt-3 text-sm text-zinc-500">Chapitre 1 gratuit, sans carte bancaire.</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {proofs.map(([t, d]) => (
          <div key={t} className="rounded-2xl border border-line bg-panel p-5">
            <h2 className="font-semibold">{t}</h2>
            <p className="mt-2 text-sm text-zinc-400">{d}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Deux façons d&apos;avancer</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-panel p-6">
            <p className="text-sm text-accent">Apprendre</p>
            <p className="mt-1 text-3xl font-bold">47 € <span className="text-base font-normal text-zinc-500">en lancement, puis 97 €</span></p>
            <p className="mt-3 text-sm text-zinc-400">Le cours en ligne. Chapitre 1 gratuit.</p>
          </div>
          <div className="rounded-2xl border border-line bg-panel p-6">
            <p className="text-sm text-accent">Fais-le pour moi</p>
            <p className="mt-1 text-3xl font-bold">24 € <span className="text-base font-normal text-zinc-500">par mois</span></p>
            <p className="mt-3 text-sm text-zinc-400">Gesto prépare tes documents, et te rappelle tes échéances. {extras && <Link href="/offres" className="underline">Voir l'offre</Link>}</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-bold">Comment ça marche</h2>
        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-4 rounded-2xl border border-line bg-panel p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-black">{i + 1}</span>{s}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-12 rounded-2xl border border-accent/40 bg-panel p-6 text-center">
        <h2 className="text-2xl font-bold">Commence par comprendre.</h2>
        <p className="mt-2 text-zinc-400">Le premier chapitre est gratuit et utile même sans Gesto.</p>
        <Link href="/cours/chapitre-1" className="mt-5 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-black">Lire le chapitre 1</Link>
      </section>
    </main>
  );
}
export const dynamic = "force-dynamic";
