import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db } from "@/lib/db";
import { addDirective } from "../actions";
import { Form } from "../ui";
import { PageHeader } from "../kit";

export const dynamic = "force-dynamic";
const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" });

export default async function Page() {
  const u = await requirePatron();
  const directives = (await db.prepare("SELECT id,body,created FROM directives WHERE company_id=? ORDER BY id DESC LIMIT 30").all(u.company_id)) as { id: number; body: string; created: string }[];
  const messages = (await db.prepare("SELECT id,directive_id,kind,body,author,created FROM staff_messages WHERE company_id=? ORDER BY id DESC LIMIT 50").all(u.company_id)) as { id: number; directive_id: number | null; kind: string; body: string; author: string; created: string }[];
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <PageHeader icon="clipboard" title="Consignes" sub="Tu écris. L'équipe répond ou envoie un rapport, sur son téléphone. Rien n'est envoyé par e-mail." />
      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Nouvelle consigne</h2>
        <div className="mt-3"><Form action={addDirective} submit="Publier la consigne">
          <label className="block text-sm font-medium">Consigne pour l&apos;équipe<textarea name="body" required rows={4} maxLength={2000} placeholder="Ex. Terrasse à rentrer si la pluie commence. Ne rien commander sans me demander." className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
        </Form></div>
      </section>
      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-bold">Déjà publiées</h2>
        {!directives.length && <p className="card p-5 text-zinc-500">Aucune consigne. La consigne du jour, sur la page Équipe, reste affichée en plus.</p>}
        {directives.map((d) => (
          <article key={d.id} className="card p-5">
            <p className="whitespace-pre-wrap text-[17px]">{d.body}</p>
            <p className="mt-2 text-xs text-zinc-500">{when(d.created)}</p>
            <ul className="mt-3 space-y-2">{messages.filter((m) => m.directive_id === d.id).map((m) => (
              <li key={m.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm"><b>{m.author}</b> · {when(m.created)}<p className="whitespace-pre-wrap">{m.body}</p></li>
            ))}</ul>
          </article>))}
      </section>
      <section className="mt-8">
        <h2 className="text-lg font-bold">Rapports de l&apos;équipe</h2>
        <ul className="mt-3 space-y-2">{messages.filter((m) => m.kind === "rapport").map((m) => (
          <li key={m.id} className="card p-4"><p className="text-sm text-zinc-500">{m.author} · {when(m.created)}</p><p className="mt-1 whitespace-pre-wrap">{m.body}</p></li>
        ))}
          {!messages.some((m) => m.kind === "rapport") && <li className="text-sm text-zinc-500">Aucun rapport pour l&apos;instant.</li>}
        </ul>
        <p className="mt-4 text-sm text-zinc-500"><Link href="/salaries" className="font-medium text-accent">Retour à l&apos;équipe</Link></p>
      </section>
    </main>
  );
}
