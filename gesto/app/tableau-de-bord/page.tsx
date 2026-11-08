import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { pushConfigured } from "@/lib/push";
import { missingInfo, type Emp } from "@/lib/documents";
import { logout } from "../actions";
import { Tile } from "../tile";

export default async function Page() {
  const u = await requirePatron();
  const co = (await db.prepare("SELECT name,invite_code FROM companies WHERE id=?").get(u.company_id)) as { name: string };
  const n = async (sql: string, ...p: unknown[]) => ((await db.prepare(sql).get(u.company_id, ...p)) as { n: number }).n;
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const emps = await n("SELECT COUNT(*) n FROM employees WHERE company_id=?");
  const toReview = await n("SELECT COUNT(*) n FROM documents WHERE company_id=? AND status='a_relire'");
  const open = await n("SELECT COUNT(*) n FROM deadlines WHERE company_id=? AND done=0");
  const late = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due<? ORDER BY due").all(u.company_id, today)) as { id: number; title: string; due: string }[];
  const soon = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due>=? AND due<=? ORDER BY due").all(u.company_id, today, in7)) as { id: number; title: string; due: string }[];
  const contracts = (await db.prepare("SELECT e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? AND d.kind='contrat' AND d.status='a_relire'").all(u.company_id)) as { enc: string }[];
  const blocked = contracts.filter((c) => missingInfo(decrypt<Emp>(c.enc)).length > 0).length;
  const devices = await n("SELECT COUNT(*) n FROM push_subs WHERE company_id=?");
  const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR");

  const tiles = [
    ...late.map((d) => <Tile key={`l${d.id}`} tone="rouge" label="En retard" title={`${d.title} (${fr(d.due)})`} href={`/echeances?id=${d.id}`} />),
    ...(blocked ? [<Tile key="b" tone="rouge" label="Contrat bloqué" title={`${blocked} contrat${blocked > 1 ? "s" : ""} : informations manquantes`} href="/documents" action="Compléter" />] : []),
    ...soon.map((d) => <Tile key={`s${d.id}`} tone="orange" label="À traiter" title={`${d.title} (${fr(d.due)})`} href={`/echeances?id=${d.id}`} />),
    ...(toReview ? [<Tile key="r" tone="orange" label="À relire" title={`${toReview} document${toReview > 1 ? "s" : ""} en attente de validation`} href="/documents" />] : []),
    ...(pushConfigured() && devices === 0 ? [<Tile key="p" tone="bleu" label="Information" title="Active les rappels sur ton téléphone" href="/echeances" action="Activer" />] : []),
  ];
  const cards = [
    { href: "/salaries", t: "Mes employés", v: `${emps} salarié${emps > 1 ? "s" : ""}` },
    { href: "/documents", t: "Mes documents", v: toReview ? `${toReview} à relire` : "Rien en attente" },
    { href: "/echeances", t: "Mes échéances", v: `${open} à venir` },
    { href: "/cours/chapitre-1", t: "Mon cours", v: "Chapitre 1" },
  ];
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <div className="flex items-start justify-between">
        <div><h1 className="text-3xl font-bold">Bonjour 👋</h1><p className="text-zinc-400">Propriétaire · {co.name}</p></div>
        <form action={logout}><button className="text-sm text-zinc-500 underline">Déconnexion</button></form>
      </div>
      <section aria-label="À traiter" className="mt-6 space-y-3">
        <h2 className="font-semibold">À traiter aujourd&apos;hui</h2>
        {tiles.length ? tiles : <Tile tone="vert" label="Tout est à jour" title="Aucune échéance proche, rien à relire" />}
      </section>
      <Link href="/salaries/nouveau" className="mt-6 block rounded-xl bg-accent px-6 py-4 text-center text-lg font-semibold text-black">+ Nouveau salarié</Link>
      <div className="mt-6 grid grid-cols-2 gap-3">
        {cards.map((t) => <Link key={t.t} href={t.href} className="rounded-2xl border border-line bg-panel p-5 hover:border-accent"><p className="text-lg font-semibold">{t.t}</p><p className="mt-1 text-sm text-zinc-400">{t.v}</p></Link>)}
      </div>
    </main>
  );
}
