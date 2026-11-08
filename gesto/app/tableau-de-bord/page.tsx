import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { pushConfigured } from "@/lib/push";
import { missingInfo, type Emp } from "@/lib/documents";
import { logout } from "../actions";
import { Tile } from "../tile";
import { Avatar, Hero } from "../brand";

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
  const alerts = late.length + soon.length;
  const actions = [
    { href: "/salaries/nouveau", t: "Nouveau salarié", d: "Contrat, fiche horaire, DPAE", primary: true },
    { href: "/documents", t: "Mes documents", d: toReview ? `${toReview} à relire` : "Rien en attente" },
    { href: "/echeances", t: "Mes échéances", d: `${open} à venir` },
  ];
  return (
    <main className="mx-auto max-w-4xl px-4 pb-10 md:px-6">
      <section className="relative overflow-hidden rounded-3xl bg-night shadow-card">
        <Hero className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <div className="relative flex min-h-[18rem] flex-col justify-between p-5 md:p-7">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 text-white"><Avatar name={co.name} /><div><p className="text-sm text-white/80"><span className="hidden sm:inline">Propriétaire · </span>{co.name}</p></div></div>
            <div className="flex items-center gap-4">
              <Link href="/echeances" aria-label={`Échéances à traiter : ${alerts}`} className="relative flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-slate-800">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0" /></svg>
                {alerts > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-bad px-1 text-xs font-bold text-white">{alerts}</span>}
              </Link>
              <form action={logout}><button className="text-sm text-white/80 underline">Déconnexion</button></form>
            </div>
          </div>
          <div className="text-white">
            <h1 className="text-3xl font-bold md:text-4xl">Bonjour 👋</h1>
            <p className="mt-1 max-w-md text-white/85">Gérez vos salariés, vos documents et vos échéances, tout en un seul endroit.</p>
          </div>
        </div>
      </section>

      <div className="-mt-6 grid grid-cols-2 gap-3 px-3 sm:grid-cols-3 md:px-5">
        {actions.map((a) => (
          <Link key={a.t} href={a.href} className={`relative flex items-center justify-between rounded-2xl p-4 shadow-card ${a.primary ? "col-span-2 sm:col-span-1" : ""} ${a.primary ? "bg-gradient-to-br from-gold to-amber-300 text-slate-900" : "bg-white text-slate-900"}`}>
            <div><p className="font-bold">{a.t}</p><p className="text-sm opacity-70">{a.d}</p></div><span aria-hidden className="text-xl">›</span>
          </Link>))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {[[emps, "Salarié" + (emps > 1 ? "s" : "")], [toReview, "À relire"], [open, "Échéances ouvertes"]].map(([v, l]) => (
          <div key={String(l)} className="card p-4"><p className="text-3xl font-bold">{v}</p><p className="text-sm text-slate-500">{l}</p></div>))}
      </div>

      <section aria-label="À traiter" className="card mt-5 space-y-3 p-4 md:p-5">
        <h2 className="text-lg font-bold">À traiter aujourd&apos;hui</h2>
        {tiles.length ? tiles : <Tile tone="vert" label="Tout est à jour" title="Aucune échéance proche, rien à relire" />}
      </section>

      <Link href="/cours/chapitre-1" className="card mt-5 flex items-center justify-between p-5"><div><p className="font-bold">Mon cours</p><p className="text-sm text-slate-500">Chapitre 1 · Embaucher sans oublier la paperasse</p></div><span aria-hidden className="text-xl text-slate-400">›</span></Link>
    </main>
  );
}
