import Link from "next/link";
import { Contours } from "./brand";
import { extras } from "@/lib/flags";

const proofs: [string, string][] = [
  ["Un document en 30 secondes", "Six questions. Le contrat, la fiche horaire et la checklist DPAE sont prêts à relire."],
  ["Zéro oubli", "Gesto suit tes échéances et te rappelle à la bonne date, sur ton téléphone. Deux notifications par semaine, pas plus."],
  ["Toi qui valides", "Rien n'est utilisable sans ta validation explicite, horodatée dans un journal."],
];
const steps: [string, string][] = [
  ["Diagnostic", "Une dizaine de questions, une par écran, de gros boutons."],
  ["Préparation", "Gesto règle ton tableau de bord et prépare tes documents."],
  ["Validation", "Tu relis, tu valides, tu télécharges. Gesto te rappelle la suite."],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-5">
      <section className="relative overflow-hidden pb-16 pt-10 md:pb-24 md:pt-20">
        <Contours className="pointer-events-none absolute -right-40 -top-10 h-[520px] w-[900px] max-w-none" stroke="#141414" opacity={0.07} cx={560} cy={170} />
        <p className="eyebrow relative">Pour les restaurateurs et commerçants</p>
        <h1 className="relative mt-5 max-w-3xl text-[44px] font-semibold leading-[1.02] tracking-[-0.035em] md:text-[76px]">
          Ta paperasse,<br /><span className="text-accent">c&apos;est fini.</span>
        </h1>
        <p className="relative mt-6 max-w-xl text-lg text-zinc-400 md:text-xl">Gesto prépare tes documents salariés, suit tes échéances et t&apos;évite les oublis. Tu gardes la main : rien ne part sans ta validation.</p>
        <div className="relative mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/cours/chapitre-1" className="btn-primary px-6 py-3.5 text-base">Je veux comprendre</Link>
          <Link href="/inscription" className="btn-ghost px-6 py-3.5 text-base">Fais-le pour moi →</Link>
        </div>
        <p className="relative mt-4 text-sm text-zinc-500">Chapitre 1 gratuit, sans carte bancaire.</p>
      </section>

      <section className="grid border-t border-line md:grid-cols-3">
        {proofs.map(([t, d], i) => (
          <div key={t} className={`py-8 md:px-8 md:first:pl-0 ${i ? "border-t border-line md:border-l md:border-t-0" : ""}`}>
            <p className="font-mono text-xs text-zinc-500">0{i + 1}</p>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">{t}</h2>
            <p className="mt-2 text-zinc-400">{d}</p>
          </div>))}
      </section>

      <section className="mt-16 md:mt-24">
        <p className="eyebrow">Tarifs</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Deux façons d&apos;avancer.</h2>
        <div className="mt-8 grid overflow-hidden rounded-lg border border-line bg-panel md:grid-cols-2">
          <div className="p-7 md:p-9">
            <p className="font-mono text-xs uppercase tracking-label text-zinc-500">Apprendre</p>
            <p className="mt-4 text-5xl font-semibold tracking-tight">47&nbsp;€</p>
            <p className="mt-1 text-sm text-zinc-500">Prix de lancement, puis 97 €. Paiement unique.</p>
            <p className="mt-6 text-zinc-400">Le cours en ligne pour tout comprendre. Le chapitre 1 est gratuit.</p>
          </div>
          <div className="border-t border-line bg-night p-7 text-white md:border-l md:border-t-0 md:p-9">
            <p className="font-mono text-xs uppercase tracking-label text-white/50">Fais-le pour moi</p>
            <p className="mt-4 text-5xl font-semibold tracking-tight">24&nbsp;€<span className="text-lg font-normal text-white/50"> / mois</span></p>
            <p className="mt-1 text-sm text-white/50">Sans engagement.</p>
            <p className="mt-6 text-white/75">Gesto prépare tes documents et te rappelle tes échéances. {extras && <Link href="/offres" className="underline underline-offset-2">Voir l&apos;offre</Link>}</p>
          </div>
        </div>
      </section>

      <section className="mt-16 md:mt-24">
        <p className="eyebrow">Comment ça marche</p>
        <ol className="mt-6 grid gap-px overflow-hidden rounded-lg border border-line bg-line md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="bg-panel p-7">
              <span className="font-mono text-sm text-accent">Étape {i + 1}</span>
              <p className="mt-3 text-lg font-semibold">{t}</p>
              <p className="mt-1 text-zinc-400">{d}</p>
            </li>))}
        </ol>
      </section>

      <section className="relative mt-16 overflow-hidden rounded-xl bg-night px-7 py-12 text-white md:mt-24 md:px-12 md:py-16">
        <Contours className="absolute inset-0 h-full w-full" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div><h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Commence par comprendre.</h2><p className="mt-2 text-white/60">Le premier chapitre est gratuit et utile même sans Gesto.</p></div>
          <Link href="/cours/chapitre-1" className="btn bg-white px-6 py-3.5 text-[#141414] hover:bg-white/90">Lire le chapitre 1 →</Link>
        </div>
      </section>
    </main>
  );
}
export const dynamic = "force-dynamic";
