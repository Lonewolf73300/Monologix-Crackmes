import { requirePatron } from "@/lib/auth";
import { db } from "@/lib/db";
import { Form, Field } from "../ui";
import { addDeadline, toggleDeadline } from "../actions";

export default async function Page() {
  const u = await requirePatron();
  const rows = db.prepare("SELECT id,title,due,remind_days,done FROM deadlines WHERE company_id=? ORDER BY done, due").all(u.company_id) as { id: number; title: string; due: string; remind_days: number; done: number }[];
  const today = new Date().toISOString().slice(0, 10);
  return (
    <main className="mx-auto max-w-3xl px-5 pb-10">
      <h1 className="text-3xl font-bold">Mes échéances</h1>
      <p className="mt-2 text-sm text-zinc-400">Rappel par email à la bonne date (2 par semaine maximum).</p>
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
