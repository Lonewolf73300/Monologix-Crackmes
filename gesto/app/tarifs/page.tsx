import Link from "next/link";

export const metadata = { title: "Tarifs" };
export default function Page() {
  const configured = !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_COURS && !!process.env.STRIPE_PRICE_ABO;
  return (
    <main className="mx-auto max-w-3xl px-5 pb-16">
      <p className="text-sm font-semibold text-zinc-500">Hors du quotidien du restaurant</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Deux offres</h1>
      <p className="mt-3 max-w-xl text-zinc-500">Ces prix ne changent pas. Ils ne sont pas dans l&apos;écran de travail de l&apos;équipe. Tant que le paiement n&apos;est pas branché, rien ne s&apos;encaisse.</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <article className="card p-6">
          <p className="text-sm font-bold uppercase tracking-wider text-zinc-500">Le cours</p>
          <p className="mt-3 text-5xl font-bold tracking-tight">47&nbsp;€</p>
          <p className="mt-1 text-sm text-zinc-500">Paiement unique</p>
          <p className="mt-4 text-sm text-zinc-500">Le chapitre 1 est déjà lisible, gratuitement. La suite du cours n&apos;est pas débitée.</p>
          <Link href="/cours/chapitre-1" className="mt-5 inline-block font-semibold text-accent">Lire le chapitre 1</Link>
        </article>
        <article className="rounded-2xl bg-night p-6 text-white shadow-lift">
          <p className="text-sm font-bold uppercase tracking-wider text-gold">Fais-le pour moi</p>
          <p className="mt-3 text-5xl font-bold tracking-tight">24&nbsp;€<span className="text-lg font-medium text-white/60">/mois</span></p>
          <p className="mt-4 text-sm text-white/70">Accompagnement, quand il sera vraiment ouvert. Aujourd&apos;hui le restaurant s&apos;en sert sans abonnement.</p>
        </article>
      </div>
      <p className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-950">{configured ? "Le paiement est configuré sur cet environnement. Il n'est pas proposé dans les écrans de l'équipe." : "Paiement non encore activé"}</p>
    </main>
  );
}
