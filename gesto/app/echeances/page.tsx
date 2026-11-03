import { requirePatron } from "@/lib/auth";
import { db } from "@/lib/db";
import { Form, Field } from "../ui";
import { addDeadline, toggleDeadline } from "../actions";
import PushButton from "./PushButton";
import Link from "next/link";
import { decrypt } from "@/lib/db";
import { KIND_LABEL, type Emp, type Kind } from "@/lib/documents";

export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const u = await requirePatron();
  const rows = db.prepare("SELECT id,title,due,remind_days,done FROM deadlines WHERE company_id=? ORDER BY done, due").all(u.company_id) as { id: number; title: string; due: string; remind_days: number; done: number }[];
  const focusId = Number((await searchParams).id) || 0;
  const focus = focusId ? db.prepare("SELECT id,title,due,employee_id FROM deadlines WHERE id=? AND company_id=?").get(focusId, u.company_id) as { id: number; title: string; due: string; employee_id: number | null } | undefined : undefined;
  const emp = focus?.employee_id ? db.prepare("SELECT enc FROM employees WHERE id=? AND company_id=?").get(focus.employee_id, u.company_id) as { enc: string } | undefined : undefined;
  const fdocs = focus?.employee_id ? db.prepare("SELECT id,kind,status,version FROM documents WHERE employee_id=? AND company_id=?").all(focus.employee_id, u.company_id) as { id: number; kind: Kind; status: string; version: number }[] : [];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <h1 className="text-3xl font-bold">Mes échéances</h1>
      <p className="mt-2 text-sm text-zinc-400">Rappel à la bonne date par notification système, à défaut par email (2 par semaine maximum).</p>
      {focus && (
        <section id="dossier" className="mt-6 rounded-2xl border-2 border-accent bg-panel p-5">
          <p className="text-xs text-accent">Dossier de l&apos;échéance</p>
          <h2 className="text-xl font-bold">{focus.title}</h2>
          <p className="text-sm text-zinc-400">Échéance le {new Date(focus.due).toLocaleDateString("fr-FR")}{emp ? ` · salarié : ${decrypt<Emp>(emp.enc).name}` : ""}</p>
          {fdocs.length > 0 && <ul className="mt-3 space-y-1 text-sm">{fdocs.map((d) => <li key={d.id}>{KIND_LABEL[d.kind]} v{d.version} — {d.status === "valide" ? "validé" : "à relire"}</li>)}</ul>}
          <Link href="/documents" className="mt-3 inline-block rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black">Ouvrir mes documents</Link>
        </section>)}
      <PushButton />
      <ul className="mt-6 space-y-2">{rows.map((r) => (
        <li key={r.id} className="flex items-center justify-between rounded-xl border border-line bg-panel p-4">
          <div className={r.done ? "opacity-50 line-through" : ""}><p className="font-semibold">{r.title}</p><p className={`text-sm ${!r.done && r.due < today ? "text-red-400" : "text-zinc-400"}`}>{new Date(r.due).toLocaleDateString("fr-FR")} · rappel {r.remind_days} j avant</p></div>
          <form action={toggleDeadline}><input type="hidden" name="id" value={r.id} /><button className="rounded-lg border border-line px-3 py-2 text-sm">{r.done ? "Rouvrir" : "Fait"}</button></form>
        </li>))}
        {!rows.length && <li className="text-zinc-500">Aucune échéance.</li>}</ul>
      <h2 className="mt-10 text-xl font-semibold">Ajouter une échéance</h2>
      <div className="mt-4 max-w-md"><Form action={addDeadline} submit="Ajouter">
        <Field label="Quoi ?" name="title" required placeholder="Ex : visite médicale de Léa" />
        <Field label="Date limite" name="due" type="date" required />
        <Field label="Rappel (jours avant)" name="remind" type="number" min="1" max="60" defaultValue="7" />
      </Form></div>
    </main>
  );
}
