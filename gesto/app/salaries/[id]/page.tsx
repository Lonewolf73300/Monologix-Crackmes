import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { KIND_LABEL, missingInfo, type Emp, type Kind } from "@/lib/documents";
import { deleteEmployee, updateEmployee } from "../../actions";
import { Form, Field } from "../../ui";
import ContractFields from "../../ContractFields";
import { Avatar } from "../../brand";
import { Icon } from "../../icons";
import { Pill } from "../../kit";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const u = await requirePatron();
  const id = Number((await params).id);
  const row = (await db.prepare("SELECT id,enc FROM employees WHERE id=? AND company_id=?").get(id, u.company_id)) as { id: number; enc: string } | undefined;
  if (!row) notFound();
  const e = decrypt<Emp>(row.enc);
  const docs = (await db.prepare("SELECT id,kind,status,version FROM documents WHERE employee_id=? AND company_id=? ORDER BY id").all(id, u.company_id)) as { id: number; kind: Kind; status: string; version: number }[];
  const miss = missingInfo(e);
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <Link href="/salaries" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-500 hover:text-[#0f172a]"><Icon name="chevronRight" className="h-4 w-4 rotate-180" />Mon équipe</Link>
      <header className="mt-3 flex items-center gap-4">
        <Avatar name={e.name} size={72} />
        <div className="min-w-0"><h1 className="truncate text-[28px] font-bold tracking-tight">{e.name}</h1><p className="text-zinc-500">{e.post} · {e.contractType} · {e.hours} h / semaine</p></div>
      </header>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Documents</h2>
        <ul className="mt-3 space-y-2">{docs.map((d) => (
          <li key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <Icon name="file" className="h-6 w-6 shrink-0 text-zinc-500" />
            <div className="min-w-0 flex-1"><p className="font-semibold">{KIND_LABEL[d.kind]}</p><p className="text-sm text-zinc-500">Version {d.version}</p></div>
            <Pill tone={d.status === "valide" ? "vert" : d.kind === "contrat" && miss.length ? "rouge" : "orange"}>{d.status === "valide" ? "Validé" : d.kind === "contrat" && miss.length ? "Incomplet" : "À relire"}</Pill>
            <a href={`/api/documents/${d.id}?apercu=1`} title="Aperçu" aria-label="Aperçu" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white"><Icon name="eye" /></a>
          </li>))}</ul>
        <Link href="/documents" className="mt-3 inline-flex items-center gap-1 font-semibold text-accent">Relire et valider <Icon name="arrowRight" className="h-4 w-4" /></Link>
      </section>

      <section className="card mt-6 p-5">
        <h2 className="text-lg font-bold">Modifier la fiche</h2>
        <p className="text-sm text-zinc-500">Les documents concernés repassent « à relire » dans une nouvelle version : rien n&apos;est utilisable sans ta validation.</p>
        <div className="mt-5"><Form action={updateEmployee} submit="Enregistrer les modifications">
          <input type="hidden" name="employee_id" value={id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="1. Nom et prénom" name="name" defaultValue={e.name} required />
            <Field label="2. Poste" name="post" defaultValue={e.post} required />
            <Field label="3. Date de début" name="start" type="date" defaultValue={e.start} required />
            <Field label="4. Horaires hebdomadaires" name="hours" type="number" step="0.5" min="1" max="48" defaultValue={e.hours} required />
            <Field label="5. Salaire brut mensuel (€)" name="salary" type="number" min="0" defaultValue={e.salary} required />
          </div>
          <ContractFields d={e} />
        </Form></div>
      </section>

      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-5">
        <h2 className="text-lg font-bold text-red-700">Supprimer la fiche</h2>
        <p className="text-sm text-red-700/80">Efface définitivement le salarié, ses documents, ses échéances et ses pointages (droit à l&apos;effacement). Pense à garder tes obligations d&apos;archivage (registre du personnel, bulletins).</p>
        <form action={deleteEmployee} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="employee_id" value={id} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="confirm" required className="h-4 w-4" />Je confirme la suppression définitive</label>
          <button className="btn bg-red-600 text-white hover:bg-red-700 sm:ml-auto">Supprimer la fiche</button>
        </form>
      </section>
    </main>
  );
}
