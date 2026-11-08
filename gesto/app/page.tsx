import Link from "next/link";
import { Banner } from "./banner";
import { Chip, Icon, type IconName } from "./icons";
import { extras } from "@/lib/flags";

const proofs: [IconName, "vert" | "orange" | "bleu", string, string][] = [
  ["clipboard", "vert", "Un document en 30 secondes", "Six questions. Le contrat, la fiche horaire et la checklist DPAE sont prêts à relire."],
  ["bell", "orange", "Zéro oubli", "Gesto suit tes échéances et te rappelle à la bonne date, sur ton téléphone. Deux notifications par semaine, pas plus."],
  ["shield", "bleu", "Toi qui valides", "Rien n'est utilisable sans ta validation explicite, horodatée dans un journal."],
];
const steps: [string, string][] = [
  ["Diagnostic", "Une dizaine de questions, une par écran, de gros boutons."],
  ["Préparation", "Gesto règle ton tableau de bord et prépare tes documents."],
  ["Validation", "Tu relis, tu valides, tu télécharges. Gesto te rappelle la suite."],
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-night text-white shadow-lift">
        <Banner className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/5" />
        <div className="relative max-w-2xl px-6 pb-12 pt-20 lg:px-12 lg:pb-16 lg:pt-28">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium backdrop-blur"><Icon name="chefHat" className="h-4 w-4" />Pour les restaurateurs et commerçants</p>
          <h1 className="mt-5 text-[44px] font-bold leading-[1.02] tracking-tight lg:text-[68px]">Ta paperasse,<br /><span className="text-gold">c&apos;est fini.</span></h1>
          <p className="mt-5 max-w-xl text-lg text-white/85">Gesto prépare tes documents salariés, suit tes échéances et t&apos;évite les oublis. Tu gardes la main : rien ne part sans ta validation.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/cours/chapitre-1" className="btn-primary px-6 py-4 text-base"><Icon name="play" filled className="h-4 w-4" />Je veux comprendre</Link>
            <Link href="/inscription" className="btn bg-white px-6 py-4 text-base text-[#0f172a] hover:bg-white/90">Fais-le pour moi <Icon name="arrowRight" className="h-4 w-4" /></Link>
          </div>
          <p className="mt-4 text-sm text-white/70">Chapitre 1 gratuit, sans carte bancaire.</p>
        </div>
      </section>

      <section className="relative -mt-8 grid gap-3 px-2 md:grid-cols-3 lg:px-8">
        {proofs.map(([ic, tone, t, d]) => (
          <div key={t} className="card p-5 shadow-lift"><Chip name={ic} tone={tone} /><h2 className="mt-4 text-lg font-bold">{t}</h2><p className="mt-1.5 text-zinc-500">{d}</p></div>))}
      </section>

      <section className="mt-16 lg:mt-24">
        <h2 className="text-center text-3xl font-bold tracking-tight lg:text-4xl">Deux façons d&apos;avancer</h2>
        <div className="mx-auto mt-8 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="card p-7">
            <Chip name="book" tone="vert" /><p className="mt-5 text-sm font-bold uppercase tracking-wider text-zinc-500">Apprendre</p>
            <p className="mt-2 text-5xl font-bold tracking-tight">47&nbsp;€</p>
            <p className="mt-1 text-sm text-zinc-500">Prix de lancement, puis 97 €. Paiement unique.</p>
            <ul className="mt-6 space-y-2.5 text-zinc-500">{["Le cours en ligne complet", "Chapitre 1 gratuit, sans carte"].map((x) => <li key={x} className="flex items-center gap-2.5"><Icon name="check" className="h-4 w-4 text-accent" />{x}</li>)}</ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl bg-night p-7 text-white shadow-lift">
            <Chip name="bolt" tone="or" /><p className="mt-5 text-sm font-bold uppercase tracking-wider text-gold">Fais-le pour moi</p>
            <p className="mt-2 text-5xl font-bold tracking-tight">24&nbsp;€<span className="text-lg font-medium text-white/50"> / mois</span></p>
            <p className="mt-1 text-sm text-white/50">Sans engagement.</p>
            <ul className="mt-6 space-y-2.5 text-white/80">{["Documents salariés préparés", "Rappels d'échéances sur téléphone", "Journal de validation"].map((x) => <li key={x} className="flex items-center gap-2.5"><Icon name="check" className="h-4 w-4 text-gold" />{x}</li>)}</ul>
            {extras && <Link href="/offres" className="btn-gold mt-6">Voir l&apos;offre</Link>}
          </div>
        </div>
      </section>

      <section className="mt-16 lg:mt-24">
        <h2 className="text-center text-3xl font-bold tracking-tight lg:text-4xl">Comment ça marche</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="card p-6"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b from-[#25b157] to-[#1a8b43] font-bold text-white shadow-green">{i + 1}</span><p className="mt-4 text-lg font-bold">{t}</p><p className="mt-1 text-zinc-500">{d}</p></li>))}
        </ol>
      </section>

      <section className="relative mt-16 overflow-hidden rounded-[2rem] bg-night px-7 py-12 text-white shadow-lift lg:mt-24 lg:px-12">
        <Banner className="absolute inset-0 h-full w-full opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-night via-night/80 to-transparent" />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div><h2 className="text-3xl font-bold tracking-tight">Commence par comprendre.</h2><p className="mt-2 text-white/70">Le premier chapitre est gratuit et utile même sans Gesto.</p></div>
          <Link href="/cours/chapitre-1" className="btn-gold px-6 py-4">Lire le chapitre 1 <Icon name="arrowRight" className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
export const dynamic = "force-dynamic";
