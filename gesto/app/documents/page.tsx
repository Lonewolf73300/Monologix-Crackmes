import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { validateDoc, completeContract } from "../actions";
import { KIND_LABEL, MENTION, missingInfo, type Emp, type Kind } from "@/lib/documents";

type Row = { employee_id: number; id: number; kind: Kind; status: string; version: number; validated_at: string | null; enc: string };
export default async function Page() {
  const u = await requirePatron();
  const rows = await db.prepare("SELECT d.employee_id,d.id,d.kind,d.status,d.version,d.validated_at,e.enc FROM documents d JOIN employees e ON e.id=d.employee_id WHERE d.company_id=? ORDER BY d.id DESC").all(u.company_id) as Row[];
  const log = await db.prepare("SELECT at,actor,action,version FROM journal WHERE company_id=? ORDER BY id DESC LIMIT 30").all(u.company_id) as { at: string; actor: string; action: string; version: number }[];
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <h1 className="text-3xl font-bold">Mes documents</h1>
      <p className="mt-2 rounded-xl border border-line bg-panel p-3 text-xs text-zinc-400">{MENTION}</p>
      <ul className="mt-6 space-y-3">{rows.map((r) => { const miss = r.kind === "contrat" ? missingInfo(decrypt<Emp>(r.enc)) : []; return (
        <li key={r.id} className="rounded-xl border border-line bg-panel p-4"><div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="font-semibold">{KIND_LABEL[r.kind]} — {decrypt<Emp>(r.enc).name}</p><p className="text-sm text-zinc-400">v{r.version} · {r.status === "valide" ? `validé le ${new Date(r.validated_at!).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}` : "à relire"}</p></div>
          <div className="flex gap-2">
            <a href={`/api/documents/${r.id}?apercu=1`} className="rounded-lg border border-line px-3 py-2 text-sm">Relire</a>
            {r.status === "valide" ? <a href={`/api/documents/${r.id}`} className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">Télécharger</a>
              : miss.length ? <span className="rounded-lg border border-red-500 px-3 py-2 text-sm text-red-700">Validation bloquée</span>
              : <form action={validateDoc}><input type="hidden" name="id" value={r.id} /><button className="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white">J&apos;ai relu, je valide</button></form>}
          </div></div>
          {miss.length > 0 && (
            <form action={completeContract} className="mt-4 space-y-3 rounded-lg border border-red-500/60 bg-red-50 p-4">
              <p role="alert" className="text-sm font-semibold text-red-700">Informations manquantes : {miss.map((m) => m.label).join(" · ")}</p>
              <input type="hidden" name="employee_id" value={r.employee_id} />
              {miss.map((m) => <label key={m.key} className="block text-sm text-zinc-300">{m.label}<input name={m.key} required className="mt-1 w-full rounded-xl border border-line bg-panel px-4 py-3" /></label>)}
              <button className="rounded-lg bg-accent px-4 py-2 font-semibold text-white">Compléter le contrat</button>
            </form>)}
        </li>); })}
        {!rows.length && <li className="text-zinc-500">Aucun document. Crée un salarié pour en générer.</li>}</ul>
      <h2 className="mt-10 text-xl font-semibold">Journal de validation</h2>
      <ul className="mt-2 space-y-1 text-sm text-zinc-400">{log.map((l, i) => <li key={i}>{new Date(l.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} · {l.actor} · {l.action} (v{l.version})</li>)}</ul>
    </main>
  );
}
