import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { pushConfigured } from "@/lib/push";
import { missingInfo, type Emp } from "@/lib/documents";
import { logout } from "../actions";
import { Tile } from "../tile";
import { Contours } from "../brand";

const TZ = "Europe/Paris";
export default async function Page() {
  const u = await requirePatron();
  const co = (await db.prepare("SELECT name FROM companies WHERE id=?").get(u.company_id)) as { name: string };
  const n = async (sql: string, ...p: unknown[]) => ((await db.prepare(sql).get(u.company_id, ...p)) as { n: number }).n;
  const today = new Date().toISOString().slice(0, 10);
  const in7 = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  const emps = await n("SELECT COUNT(*) n FROM employees WHERE company_id=?");
  const toReview = await n("SELECT COUNT(*) n FROM documents WHERE company_id=? AND status='a_relire'");
  const open = await n("SELECT COUNT(*) n FROM deadlines WHERE company_id=? AND done=0");
  const late = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due<? ORDER BY due").all(u.company_id, today)) as { id: number; title: string; due: string }[];
  const soon = (await db.prepare("SELECT id,title,due FROM deadlines WHERE company_id=? AND done=0 AND due>=? AND due<=? ORDER BY due").all(u.company_id, today, in7)) as { id: number; title: string; due: string }[];
  const next = (await db.prepare("SELECT due FROM deadlines WHERE company_id=? AND done=0 AND due>=? ORDER BY due LIMIT 1").get(u.company_id, today)) as { due: string } | undefined;
  const contracts = (await db.prepare("SELECT e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? AND d.kind='contrat' AND d.status='a_relire'").all(u.company_id)) as { enc: string }[];
  const blocked = contracts.filter((c) => missingInfo(decrypt<Emp>(c.enc)).length > 0).length;
  const devices = await n("SELECT COUNT(*) n FROM push_subs WHERE company_id=?");

  const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
  const days = (d: string) => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  const rel = (d: string) => { const k = days(d); return k < 0 ? `en retard de ${-k} j` : k === 0 ? "aujourd'hui" : `dans ${k} j`; };
  const tiles = [
    ...late.map((d) => <Tile variant="row" key={`l${d.id}`} tone="rouge" label="En retard" title={d.title} meta={`${fr(d.due)} · ${rel(d.due)}`} href={`/echeances?id=${d.id}`} />),
    ...(blocked ? [<Tile variant="row" key="b" tone="rouge" label="Contrat bloqué" title={`${blocked} contrat${blocked > 1 ? "s" : ""} : informations manquantes`} href="/documents" action="Compléter" />] : []),
    ...soon.map((d) => <Tile variant="row" key={`s${d.id}`} tone="orange" label="Échéance" title={d.title} meta={`${fr(d.due)} · ${rel(d.due)}`} href={`/echeances?id=${d.id}`} />),
    ...(toReview ? [<Tile variant="row" key="r" tone="orange" label="À relire" title={`${toReview} document${toReview > 1 ? "s" : ""} en attente de validation`} href="/documents" action="Relire" />] : []),
    ...(pushConfigured() && devices === 0 ? [<Tile variant="row" key="p" tone="bleu" label="Rappels" title="Active les notifications sur ton téléphone" href="/echeances" action="Activer" />] : []),
  ];
  const urgent = late.length + (blocked ? 1 : 0);
  const todo = tiles.length;
  const dateLong = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: TZ });
  const metrics: [string, string][] = [
    [String(emps), emps > 1 ? "Salariés" : "Salarié"],
    [String(toReview), "À relire"],
    [String(open), "Échéances ouvertes"],
    [next ? (days(next.due) === 0 ? "J" : `J-${days(next.due)}`) : "—", "Prochaine échéance"],
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 md:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="w-full md:w-auto">
          <div className="flex items-center justify-between gap-4">
            <p className="eyebrow first-letter:uppercase">{dateLong} · {co.name}</p>
            <form action={logout} className="md:hidden"><button className="text-xs text-zinc-500 underline underline-offset-2">Déconnexion</button></form>
          </div>
          <h1 className="mt-2 text-[32px] font-semibold leading-[1.1] tracking-tight md:text-[44px]">
            {todo ? <>{todo} point{todo > 1 ? "s" : ""} à traiter<span className="text-zinc-500"> aujourd&apos;hui.</span></> : <>Tout est en ordre.</>}
          </h1>
          <p className="mt-2 text-zinc-400">{todo ? `${urgent} bloquant${urgent > 1 ? "s" : ""} · ${todo - urgent} à prévoir` : "Aucune échéance dans les 7 jours, aucun document en attente."}</p>
        </div>
        <Link href="/salaries/nouveau" className="btn-primary w-full md:w-auto">+ Nouveau salarié</Link>
      </header>

      <section className="relative mt-8 overflow-hidden rounded-xl bg-night text-white">
        <Contours className="absolute inset-0 h-full w-full" />
        <dl className="relative grid grid-cols-2 md:grid-cols-4">
          {metrics.map(([v, l], i) => (
            <div key={l} className={`px-5 py-6 md:px-7 md:py-8 ${i % 2 ? "border-l border-white/10" : ""} ${i > 1 ? "border-t border-white/10 md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}>
              <dt className="font-mono text-[10px] uppercase tracking-label text-white/45">{l}</dt>
              <dd className="mt-2 font-mono text-4xl font-medium tracking-tight md:text-5xl">{v}</dd>
            </div>))}
        </dl>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section aria-label="À traiter" className="lg:col-span-2">
          <h2 className="eyebrow">À traiter</h2>
          <div className="card mt-3 divide-y divide-line overflow-hidden">
            {todo ? tiles : <Tile variant="row" tone="vert" label="À jour" title="Rien à faire pour le moment" />}
          </div>
        </section>
        <aside>
          <h2 className="eyebrow">Raccourcis</h2>
          <div className="card mt-3 divide-y divide-line">
            {[
              ["/salaries/nouveau", "Créer un salarié", "Contrat, fiche horaire, checklist DPAE"],
              ["/echeances", "Ajouter une échéance", "Rappel à la bonne date"],
              ["/documents", "Journal de validation", "Qui a validé quoi, et quand"],
              ["/cours/chapitre-1", "Mon cours", "Chapitre 1 · Embaucher sans oubli"],
            ].map(([h, t, d]) => (
              <Link key={h + t} href={h} className="group flex items-center justify-between px-5 py-4 hover:bg-[#faf9f6]">
                <div><p className="font-medium">{t}</p><p className="text-sm text-zinc-500">{d}</p></div>
                <span aria-hidden className="text-zinc-600 transition-transform group-hover:translate-x-0.5">→</span>
              </Link>))}
          </div>
        </aside>
      </div>
    </main>
  );
}
