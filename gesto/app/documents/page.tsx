import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { validateDoc, completeContract } from "../actions";
import { KIND_LABEL, MENTION, missingInfo, type Emp, type Kind } from "@/lib/documents";
import { Avatar } from "../brand";
import { Icon } from "../icons";
import { PageHeader, Pill } from "../kit";

type Row = { employee_id: number; id: number; kind: Kind; status: string; version: number; validated_at: string | null; enc: string };
const TZ = "Europe/Paris";
const when = (iso: string) => new Date(iso).toLocaleString("fr-FR", { timeZone: TZ });
// Anciennes entrées du journal : codes techniques → libellés lisibles.
const readable = (a: string) => a.replace(/\b(contrat|fiche_horaire|checklist_dpae)\b/g, (k) => KIND_LABEL[k as Kind]);

export default async function Page() {
  const u = await requirePatron();
  const rows = (await db.prepare("SELECT d.employee_id,d.id,d.kind,d.status,d.version,d.validated_at,e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? ORDER BY d.employee_id DESC, d.id").all(u.company_id)) as Row[];
  const log = (await db.prepare("SELECT at,actor,action,version FROM journal WHERE company_id=? ORDER BY id DESC LIMIT 40").all(u.company_id)) as { at: string; actor: string; action: string; version: number | null }[];
  const groups = new Map<number, { emp: Emp; docs: Row[] }>();
  for (const r of rows) { const g = groups.get(r.employee_id) ?? { emp: decrypt<Emp>(r.enc), docs: [] }; g.docs.push(r); groups.set(r.employee_id, g); }
  const pending = rows.filter((r) => r.status !== "valide").length;
  return (
    <main className="mx-auto max-w-4xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <PageHeader icon="file" tone="orange" title="Mes documents" sub={pending ? `${pending} document${pending > 1 ? "s" : ""} à relire` : "Tout est validé"} />
      <p className="mt-5 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><Icon name="info" className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />{MENTION}</p>

      <div className="mt-6 space-y-5">{[...groups.entries()].map(([eid, g]) => {
        const miss = missingInfo(g.emp); const ok = g.docs.filter((d) => d.status === "valide").length;
        return (
          <section key={eid} className="card p-4 lg:p-5">
            <div className="flex items-center gap-3">
              <Avatar name={g.emp.name} size={46} />
              <div className="min-w-0 flex-1"><Link href={`/salaries/${eid}`} className="block truncate text-lg font-bold hover:underline">{g.emp.name}</Link><p className="truncate text-sm text-zinc-500">{g.emp.post} · {g.emp.contractType}</p></div>
              <Pill tone={ok === g.docs.length ? "vert" : "orange"}>{ok}/{g.docs.length} validés</Pill>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(ok / g.docs.length) * 100}%` }} /></div>
            <ul className="mt-4 space-y-2">{g.docs.map((r) => {
              const blocked = r.kind === "contrat" && r.status !== "valide" && miss.length > 0;
              return (
                <li key={r.id} className={`rounded-xl px-4 py-3 ${blocked ? "bg-red-50" : r.status === "valide" ? "bg-green-50/60" : "bg-slate-50"}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <Icon name={r.status === "valide" ? "checkCircle" : blocked ? "alert" : "file"} className={`h-6 w-6 shrink-0 ${r.status === "valide" ? "text-green-600" : blocked ? "text-red-600" : "text-amber-500"}`} />
                    <div className="min-w-0 flex-1"><p className="font-semibold">{KIND_LABEL[r.kind]} — {g.emp.name}</p><p className="text-sm text-zinc-500">{r.status === "valide" ? `v${r.version} · validé le ${when(r.validated_at!)}` : `v${r.version} · à relire`}</p><p className="text-xs font-semibold text-zinc-600">{r.status === "valide" ? "Statut : Validé par le patron" : "Statut : À relire"} — brouillon à faire vérifier, pas un contrat à signer. Convention collective et clauses obligatoires à contrôler.</p></div>
                    <div className="flex gap-2">
                      <a href={`/api/documents/${r.id}?apercu=1`} className="btn-ghost px-3 py-2 text-sm"><Icon name="eye" className="h-4 w-4" />Relire</a>
                      {r.status === "valide" ? <a href={`/api/documents/${r.id}`} className="btn-primary px-3 py-2 text-sm">Télécharger</a>
                        : blocked ? <span className="inline-flex items-center rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-600">Validation bloquée</span>
                        : <form action={validateDoc}><input type="hidden" name="id" value={r.id} /><button className="btn-primary px-3 py-2 text-sm"><Icon name="check" className="h-4 w-4" />J&apos;ai relu, je valide</button></form>}
                    </div>
                  </div>
                  {blocked && (
                    <form action={completeContract} className="mt-3 space-y-3 border-t border-red-200 pt-3">
                      <p role="alert" className="text-sm font-semibold text-red-700">Informations manquantes : {miss.map((m) => m.label).join(" · ")}</p>
                      <input type="hidden" name="employee_id" value={r.employee_id} />
                      <div className="grid gap-3 sm:grid-cols-2">{miss.map((m) => <label key={m.key} className="block text-sm font-medium text-zinc-300">{m.label}<input name={m.key} required className="mt-1.5 w-full rounded-lg border border-red-200 bg-white px-3.5 py-2.5 outline-none focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>)}</div>
                      <button className="btn-primary px-4 py-2.5 text-sm">Compléter le contrat</button>
                    </form>)}
                </li>);
            })}</ul>
          </section>);
      })}
        {!rows.length && <div className="card p-8 text-center"><p className="text-lg font-bold">Aucun document</p><p className="mt-1 text-zinc-500">Crée un salarié : ses documents sont générés en 30 secondes.</p><Link href="/salaries/nouveau" className="btn-primary mt-5">Nouveau salarié</Link></div>}
      </div>

      <details className="card group mt-6 p-5" open>
        <summary className="flex cursor-pointer list-none items-center justify-between"><span className="text-lg font-bold">Journal de validation</span><Icon name="chevronDown" className="h-5 w-5 text-zinc-400 transition group-open:rotate-180" /></summary>
        <p className="mt-1 text-sm text-zinc-500">Qui, quand, quelle version : chaque action est horodatée.</p>
        <ol className="mt-4 space-y-3 border-l-2 border-line pl-4">{log.map((l, i) => (
          <li key={i} className="relative">
            <span className={`absolute -left-[23px] top-1.5 h-3 w-3 rounded-full ring-4 ring-white ${l.action.startsWith("Document validé") ? "bg-green-500" : l.action.includes("supprimée") ? "bg-red-500" : "bg-slate-300"}`} />
            <p className="font-medium">{readable(l.action)}{l.version ? <span className="ml-2 text-xs text-zinc-500">v{l.version}</span> : null}</p>
            <p className="text-xs text-zinc-500">{when(l.at)} · {l.actor}</p>
          </li>))}
          {!log.length && <li className="text-sm text-zinc-500">Rien pour l&apos;instant.</li>}</ol>
      </details>
    </main>
  );
}
