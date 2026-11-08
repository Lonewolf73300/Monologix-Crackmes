import { notFound } from "next/navigation";
import { extras } from "@/lib/flags";
import Link from "next/link";
import { currentUser } from "@/lib/auth";

export const metadata = { title: "Choisir mon offre" };
export default async function Page() {
  if (!extras) notFound();
  const u = await currentUser();
  const configured = !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_COURS && !!process.env.STRIPE_PRICE_ABO;
  const offers = [
    { id: "cours", t: "Apprendre", p: "47 € une fois (puis 97 €)", d: "Le cours complet. Paiement unique, aucun prélèvement ensuite." },
    { id: "abonnement", t: "Fais-le pour moi", p: "24 € par mois", d: "Prélèvement mensuel, email de rappel avant chaque prélèvement, résiliation en un clic." },
  ];
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <h1 className="text-3xl font-bold">Choisir mon offre</h1>
      {!configured && <p className="mt-4 rounded-xl border border-line bg-panel p-4 text-sm text-zinc-400">Le paiement n&apos;est pas encore ouvert. Tu peux lire le chapitre 1 gratuitement.</p>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">{offers.map((o) => (
        <form key={o.id} action="/api/checkout" method="post" className="card p-6">
          <input type="hidden" name="offer" value={o.id} />
          <p className="text-sm text-accent">{o.t}</p><p className="mt-1 text-2xl font-bold">{o.p}</p><p className="mt-2 text-sm text-zinc-400">{o.d}</p>
          {configured && (u ? <>
            <label className="mt-4 flex gap-2 text-xs text-zinc-400"><input type="checkbox" name="accept" required /> J&apos;accepte les <Link href="/mentions-legales" className="underline">conditions</Link>, le prix et la date de prélèvement affichés, et mon droit de rétractation.</label>
            <button className="mt-3 w-full rounded-xl bg-accent px-5 py-3 font-semibold text-white">Payer</button></>
            : <Link href="/inscription" className="mt-4 block rounded-xl bg-accent px-5 py-3 text-center font-semibold text-white">Créer un compte pour continuer</Link>)}
        </form>))}</div>
    </main>
  );
}
export const dynamic = "force-dynamic";
