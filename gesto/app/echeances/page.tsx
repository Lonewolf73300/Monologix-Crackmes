import Link from "next/link";
import { requirePatron } from "@/lib/auth";
import { db, decrypt } from "@/lib/db";
import { Form, Field } from "../ui";
import { addDeadline, deleteDeadline, toggleDeadline } from "../actions";
import PushButton from "./PushButton";
import { KIND_LABEL, type Emp, type Kind } from "@/lib/documents";
import { Icon } from "../icons";
import { PageHeader, Pill } from "../kit";

type D = { id: number; title: string; due: string; remind_days: number; done: number };
export default async function Page({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const u = await requirePatron();
  const rows = (await db.prepare("SELECT id,title,due,remind_days,done FROM deadlines WHERE company_id=? ORDER BY done, due").all(u.company_id)) as D[];
  const focusId = Number((await searchParams).id) || 0;
  const focus = focusId ? ((await db.prepare("SELECT id,title,due,employee_id FROM deadlines WHERE id=? AND company_id=?").get(focusId, u.company_id)) as { id: number; title: string; due: string; employee_id: number | null } | undefined) : undefined;
  const emp = focus?.employee_id ? ((await db.prepare("SELECT enc FROM employees WHERE id=? AND company_id=?").get(focus.employee_id, u.company_id)) as { enc: string } | undefined) : undefined;
  const fdocs = focus?.employee_id ? ((await db.prepare("SELECT id,kind,status,version FROM documents WHERE employee_id=? AND company_id=? ORDER BY id").all(focus.employee_id, u.company_id)) as { id: number; kind: Kind; status: string; version: number }[]) : [];
  const today = new Date().toISOString().slice(0, 10);
  const days = (d: string) => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);
  const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const rel = (d: string) => { const k = days(d); return k < 0 ? `en retard de ${-k} j` : k === 0 ? "aujourd'hui" : k === 1 ? "demain" : `dans ${k} j`; };
  const late = rows.filter((r) => !r.done && r.due < today), todayRows = rows.filter((r) => !r.done && r.due === today), next = rows.filter((r) => !r.done && r.due > today), done = rows.filter((r) => r.done);
  const history = (await db.prepare("SELECT at,subject,status FROM notifications WHERE company_id=? ORDER BY id DESC LIMIT 20").all(u.company_id)) as { at: string; subject: string; status: string }[];

  const Item = ({ r }: { r: D }) => {
    const tone = r.done ? "vert" : r.due < today ? "rouge" : days(r.due) <= 7 ? "orange" : "bleu";
    const bar = { vert: "bg-green-500", rouge: "bg-red-500", orange: "bg-amber-500", bleu: "bg-blue-500" }[tone];
    const d = new Date(r.due);
    return (
      <li className="card relative flex flex-wrap items-center gap-x-4 gap-y-2 overflow-hidden py-3.5 pl-5 pr-3">
        <span className={`absolute inset-y-0 left-0 w-1.5 ${bar}`} />
        <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-slate-50 py-1.5"><span className="text-[11px] font-bold uppercase text-zinc-500">{d.toLocaleDateString("fr-FR", { month: "short" })}</span><span className="text-2xl font-bold leading-none">{d.getUTCDate()}</span></div>
        <Link href={`/echeances?id=${r.id}`} className={`min-w-[60%] flex-1 ${r.done ? "opacity-55" : ""}`}>
          <p className={`font-semibold leading-snug ${r.done ? "line-through" : ""}`}>{r.title}</p>
          <p className="text-sm text-zinc-500">{fr(r.due)} · {r.done ? "faite" : rel(r.due)} · rappel {r.remind_days} j avant</p>
        </Link>
        <div className="ml-auto flex items-center gap-1"><form action={toggleDeadline}><input type="hidden" name="id" value={r.id} /><button className={r.done ? "btn-ghost px-3 py-2 text-sm" : "btn-primary px-3 py-2 text-sm"}>{r.done ? "Rouvrir" : <><Icon name="check" className="h-4 w-4" />Fait</>}</button></form>
        <form action={deleteDeadline}><input type="hidden" name="id" value={r.id} /><button title="Supprimer l'échéance" aria-label={`Supprimer ${r.title}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-50 hover:text-red-600"><Icon name="plus" className="h-5 w-5 rotate-45" /></button></form></div>
      </li>);
  };
  const Group = ({ title, tone, list }: { title: string; tone: "rouge" | "orange" | "vert"; list: D[] }) => list.length ? (
    <section className="mt-6"><div className="flex items-center gap-2"><h2 className="text-lg font-bold">{title}</h2><Pill tone={tone}>{list.length}</Pill></div><ul className="mt-3 space-y-2.5">{list.map((r) => <Item key={r.id} r={r} />)}</ul></section>) : null;

  return (
    <main className="mx-auto max-w-4xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <PageHeader icon="calendar" tone="bleu" title="Mes échéances" sub="Le rappel s'affiche ici à la date. Deux notifications par semaine au maximum, si tu as activé le téléphone." />
      <p className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{process.env.RESEND_API_KEY ? "L'envoi d'e-mails est configuré. Un e-mail ne part que si la notification sur le téléphone n'a pas abouti." : "Les rappels par e-mail ne sont pas activés. Aucun message n'est envoyé. Le rappel reste visible dans cette page, à la date indiquée."}</p>

      {focus && (
        <section id="dossier" className="mt-6 overflow-hidden rounded-[22px] border-2 border-accent bg-white shadow-lift">
          <div className="bg-green-50 px-5 py-3 text-sm font-bold uppercase tracking-wide text-green-700">Dossier de l&apos;échéance</div>
          <div className="p-5">
            <h2 className="text-2xl font-bold tracking-tight">{focus.title}</h2>
            <p className="mt-1 text-zinc-500">Échéance le {new Date(focus.due).toLocaleDateString("fr-FR")}{emp ? ` · salarié : ${decrypt<Emp>(emp.enc).name}` : ""}</p>
            {fdocs.length > 0 && <ul className="mt-4 space-y-2">{fdocs.map((d) => (
              <li key={d.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5"><Icon name={d.status === "valide" ? "checkCircle" : "file"} className={`h-5 w-5 ${d.status === "valide" ? "text-green-600" : "text-amber-500"}`} /><span className="flex-1">{KIND_LABEL[d.kind]} v{d.version} — {d.status === "valide" ? "validé" : "à relire"}</span></li>))}</ul>}
            <div className="mt-4 flex flex-wrap gap-2"><Link href="/documents" className="btn-primary">Ouvrir mes documents</Link>{focus.employee_id && <Link href={`/salaries/${focus.employee_id}`} className="btn-ghost">Voir la fiche</Link>}</div>
          </div>
        </section>)}

      <PushButton />

      {!rows.length && <div className="card mt-6 p-8 text-center"><p className="text-lg font-bold">Aucune échéance</p><p className="mt-1 text-zinc-500">Ajoute une date à ne pas rater : Gesto te la rappellera.</p></div>}
      <Group title="Rappel du jour" tone="orange" list={todayRows} />
      <Group title="En retard" tone="rouge" list={late} />
      <Group title="À venir" tone="orange" list={next} />
      <Group title="Faites" tone="vert" list={done} />
      <section className="mt-8">
        <h2 className="text-lg font-bold">Historique des rappels</h2>
        <ul className="mt-3 space-y-2">{history.map((h, i) => <li key={i} className="card px-4 py-3 text-sm"><p className="font-medium">{h.subject}</p><p className="text-zinc-500">{new Date(h.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })} · {h.status === "non_envoye" ? "affiché dans l'application, e-mail non envoyé" : h.status === "email_envoye" ? "e-mail envoyé" : h.status === "push_envoye" ? "notification téléphone" : h.status}</p></li>)}
          {!history.length && <li className="text-sm text-zinc-500">Aucun rappel déclenché pour l&apos;instant. Une échéance ouverte apparaît ci-dessus dès que sa date est atteinte ou dépassée.</li>}</ul>
      </section>

      <section className="card mt-8 p-5 lg:p-6">
        <h2 className="text-lg font-bold">Ajouter une échéance</h2>
        <div className="mt-4"><Form action={addDeadline} submit="Ajouter">
          <Field label="Quoi ?" name="title" required placeholder="Ex : visite médicale, fin de CDD, contrôle extincteurs" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date limite" name="due" type="date" required />
            <Field label="Rappel (jours avant)" name="remind" type="number" min="1" max="60" defaultValue="7" />
          </div>
        </Form></div>
      </section>
    </main>
  );
}
